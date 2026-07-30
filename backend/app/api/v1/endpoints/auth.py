from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta, timezone, date
from decimal import Decimal
import random

from app.core.database import get_db
from app.core.email import email_service
from app.core.ratelimit import limiter
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    generate_refresh_token,
    hash_token,
    create_email_token,
    decode_email_token,
    password_fingerprint,
    VERIFY,
    RESET,
)
from app.models import (
    User as UserModel,
    RefreshToken,
    Category,
    Transaction,
    TransactionType,
    TransactionSource,
    Budget,
    BudgetPeriod,
)
from app.schemas import (
    UserCreate,
    User as UserSchema,
    TokenPair,
    RefreshRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ResendVerificationRequest,
    MessageResponse,
    UserUpdate,
)
from app.api.v1.dependencies import get_current_user
from app.core.config import settings

router = APIRouter()

# Icons use \U escapes so this source stays pure ASCII.
DEFAULT_CATEGORIES = [
    ("Food & Dining", "\U0001F354", "#FF6B6B"),
    ("Transport", "\U0001F68C", "#4ECDC4"),
    ("Shopping", "\U0001F6CD️", "#45B7D1"),
    ("Entertainment", "\U0001F3AE", "#96CEB4"),
    ("Bills & Utilities", "\U0001F4A1", "#FFEAA7"),
    ("Healthcare", "\U0001F3E5", "#DDA0DD"),
    ("Education", "\U0001F4DA", "#98D8C8"),
    ("Salary", "\U0001F4B0", "#77DD77"),
    ("Investments", "\U0001F4C8", "#FDFD96"),
    ("Others", "\U0001F4E6", "#CFCFCF"),
]


def _now() -> datetime:
    return datetime.now(timezone.utc)


import uuid

async def _issue_token_pair(user: UserModel, db: AsyncSession) -> dict:
    """Mint an access token, set active session ID for single-device login, and persist refresh token."""
    access_token = create_access_token(subject=user.id)
    raw_refresh = generate_refresh_token()
    session_id = str(uuid.uuid4())
    user.active_session_id = session_id
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=hash_token(raw_refresh),
            expires_at=_now() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
    )
    await db.commit()
    return {
        "access_token": access_token,
        "refresh_token": raw_refresh,
        "session_id": session_id,
        "token_type": "bearer",
    }


async def _send_verification(user: UserModel) -> None:
    token = create_email_token(subject=user.id, purpose=VERIFY)
    await run_in_threadpool(email_service.send_verification, user.email, token)


@router.post("/register", response_model=TokenPair, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def register(request: Request, user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserModel).where(UserModel.email == user_in.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    if user_in.phone_number:
        result = await db.execute(select(UserModel).where(UserModel.phone_number == user_in.phone_number))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Phone number already registered")

    user = UserModel(
        email=user_in.email,
        full_name=user_in.full_name,
        phone_number=user_in.phone_number,
        hashed_password=get_password_hash(user_in.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    db.add_all(
        Category(name=n, icon=i, color=c, is_default=True, user_id=user.id)
        for n, i, c in DEFAULT_CATEGORIES
    )
    await db.commit()

    await _send_verification(user)
    return await _issue_token_pair(user, db)


@router.post("/login", response_model=TokenPair)
@limiter.limit("20/minute")
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    email_clean = form_data.username.strip().lower() if form_data.username else ""
    result = await db.execute(select(UserModel).where(func.lower(UserModel.email) == email_clean))
    user = result.scalar_one_or_none()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return await _issue_token_pair(user, db)


@router.post("/refresh", response_model=TokenPair)
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Rotate a refresh token: revoke the presented one, issue a fresh pair."""
    token_hash = hash_token(body.refresh_token)
    result = await db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    stored = result.scalar_one_or_none()

    invalid = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")
    if stored is None or stored.revoked or stored.expires_at <= _now():
        raise invalid

    result = await db.execute(select(UserModel).where(UserModel.id == stored.user_id))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise invalid

    stored.revoked = True
    await db.flush()
    return await _issue_token_pair(user, db)


@router.post("/logout", response_model=MessageResponse)
async def logout(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Revoke a refresh token. Idempotent."""
    result = await db.execute(select(RefreshToken).where(RefreshToken.token_hash == hash_token(body.refresh_token)))
    stored = result.scalar_one_or_none()
    if stored and not stored.revoked:
        stored.revoked = True
        await db.commit()
    return {"message": "Logged out"}


@router.get("/verify-email", response_model=MessageResponse)
async def verify_email(token: str, db: AsyncSession = Depends(get_db)):
    payload = decode_email_token(token, VERIFY)
    if payload is None:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link")
    result = await db.execute(select(UserModel).where(UserModel.id == int(payload["sub"])))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link")
    if not user.is_verified:
        user.is_verified = True
        await db.commit()
    return {"message": "Email verified"}


@router.post("/resend-verification", response_model=MessageResponse)
@limiter.limit("5/minute")
async def resend_verification(
    request: Request, body: ResendVerificationRequest, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(UserModel).where(UserModel.email == body.email))
    user = result.scalar_one_or_none()
    if user and not user.is_verified:
        await _send_verification(user)
    return {"message": "If that account exists and is unverified, a verification email has been sent."}


@router.post("/forgot-password", response_model=MessageResponse)
@limiter.limit("5/minute")
async def forgot_password(
    request: Request, body: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(UserModel).where(UserModel.email == body.email))
    user = result.scalar_one_or_none()
    if user:
        token = create_email_token(
            subject=user.id,
            purpose=RESET,
            extra={"pwf": password_fingerprint(user.hashed_password)},
        )
        await run_in_threadpool(email_service.send_password_reset, user.email, token)
    return {"message": "If that account exists, a password reset email has been sent."}


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_email_token(body.token, RESET)
    invalid = HTTPException(status_code=400, detail="Invalid or expired reset link")
    if payload is None:
        raise invalid
    result = await db.execute(select(UserModel).where(UserModel.id == int(payload["sub"])))
    user = result.scalar_one_or_none()
    if user is None:
        raise invalid
    if payload.get("pwf") != password_fingerprint(user.hashed_password):
        raise invalid

    user.hashed_password = get_password_hash(body.new_password)
    tokens = await db.execute(
        select(RefreshToken).where(RefreshToken.user_id == user.id, RefreshToken.revoked == False)  # noqa: E712
    )
    for rt in tokens.scalars().all():
        rt.revoked = True
    await db.commit()
    return {"message": "Password updated. Please sign in with your new password."}


@router.get("/me", response_model=UserSchema)
async def get_me(current_user: UserModel = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserSchema)
async def update_me(
    user_in: UserUpdate,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user_in.full_name is not None:
        current_user.full_name = user_in.full_name
    if user_in.phone_number is not None:
        result = await db.execute(
            select(UserModel).where(
                UserModel.phone_number == user_in.phone_number, UserModel.id != current_user.id
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Phone number already registered")
        current_user.phone_number = user_in.phone_number
    if user_in.is_active is not None:
        current_user.is_active = user_in.is_active

    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.post("/seed", status_code=status.HTTP_201_CREATED)
async def seed_data(current_user: UserModel = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Seed demo data for the current user"""

    result = await db.execute(select(Transaction).where(Transaction.user_id == current_user.id))
    if result.scalars().first():
        return {"message": "Data already exists", "seeded": False}

    result = await db.execute(select(Category).where(Category.user_id == current_user.id))
    categories = result.scalars().all()

    if not categories:
        default_categories = [
            Category(name=n, icon=i, color=c, is_default=True, user_id=current_user.id)
            for n, i, c in DEFAULT_CATEGORIES
        ]
        db.add_all(default_categories)
        await db.commit()
        for cat in default_categories:
            await db.refresh(cat)
        categories = default_categories

    cat_map = {c.name: c for c in categories}

    merchants = {
        "Food & Dining": ["Swiggy", "Zomato", "Starbucks", "Local Restaurant", "Pizza Hut"],
        "Transport": ["Uber", "Ola", "Metro", "Bus Pass", "Fuel Station", "Parking"],
        "Shopping": ["Amazon", "Flipkart", "Myntra", "Reliance Digital", "Mall"],
        "Entertainment": ["Netflix", "Spotify", "PVR Cinemas", "Concert", "Gaming"],
        "Bills & Utilities": ["Electricity Bill", "Broadband", "Mobile Recharge", "Water Bill"],
        "Healthcare": ["Pharmacy", "Doctor Visit", "Dental", "Insurance"],
        "Education": ["Udemy Course", "Books", "Workshop", "Certification"],
        "Salary": ["Monthly Salary", "Freelance Payment", "Bonus"],
        "Investments": ["Stock Purchase", "Crypto", "Mutual Fund"],
        "Others": ["Gift", "Donation", "Miscellaneous"],
    }

    descriptions = {
        "Food & Dining": ["Lunch with colleagues", "Coffee break", "Dinner out", "Weekend brunch"],
        "Transport": ["Commute to work", "Airport ride", "City travel", "Weekend trip"],
        "Shopping": ["Groceries", "Electronics", "Clothing", "Home supplies"],
        "Entertainment": ["Movie night", "Subscription", "Game purchase", "Event tickets"],
        "Bills & Utilities": ["Monthly bill", "Utility payment", "Service charge"],
        "Healthcare": ["Medication", "Checkup", "Treatment", "Health insurance"],
        "Education": ["Online course", "Textbook", "Workshop fee", "Certification"],
        "Salary": ["Salary deposit", "Freelance income", "Performance bonus"],
        "Investments": ["Stock investment", "Crypto purchase", "Fund investment"],
        "Others": ["Gift for friend", "Charity donation", "Other expense"],
    }

    end_date = date.today()
    start_date = end_date.replace(day=1) - timedelta(days=60)
    if start_date.month == end_date.month:
        start_date = start_date.replace(month=start_date.month - 1)

    transactions = []
    current_date = start_date

    while current_date <= end_date:
        num_transactions = random.randint(0, 3)

        for _ in range(num_transactions):
            tx_type = random.choices(
                [TransactionType.EXPENSE, TransactionType.INCOME, TransactionType.TRANSFER],
                weights=[70, 25, 5],
            )[0]

            if tx_type == TransactionType.INCOME:
                category_name = "Salary"
                amount = round(random.uniform(40000, 120000), 2)
            elif tx_type == TransactionType.TRANSFER:
                category_name = "Others"
                amount = round(random.uniform(500, 10000), 2)
            else:
                category_name = random.choice(list(merchants.keys()))
                if category_name == "Salary":
                    category_name = "Others"
                amount = round(random.uniform(50, 4000), 2)

            category = cat_map.get(category_name)
            merchant_list = merchants.get(category_name, ["Various"])

            transactions.append(
                Transaction(
                    user_id=current_user.id,
                    category_id=category.id if category else None,
                    amount=Decimal(str(amount)),
                    currency="INR",
                    type=tx_type,
                    source=TransactionSource.MANUAL,
                    description=random.choice(descriptions.get(category_name, ["Transaction"])),
                    merchant_name=random.choice(merchant_list),
                    transaction_date=current_date,
                )
            )

        current_date += timedelta(days=1)

    db.add_all(transactions)
    await db.commit()

    budgets = []
    for cat_name in ["Food & Dining", "Transport", "Shopping", "Entertainment", "Bills & Utilities"]:
        category = cat_map.get(cat_name)
        if category:
            budgets.append(
                Budget(
                    user_id=current_user.id,
                    category_id=category.id,
                    name=f"{cat_name} Budget",
                    amount=Decimal(str(round(random.uniform(5000, 30000), 2))),
                    period=BudgetPeriod.MONTHLY,
                    start_date=date.today().replace(day=1),
                    is_active=True,
                )
            )

    db.add_all(budgets)
    await db.commit()

    return {
        "message": "Demo data seeded successfully",
        "seeded": True,
        "transactions": len(transactions),
        "categories": len(categories),
        "budgets": len(budgets),
    }
