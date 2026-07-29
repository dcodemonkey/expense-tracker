from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal
from app.models import TransactionType, TransactionSource, TransactionStatus, BudgetPeriod, InsightType, DeviceType


class DeviceBase(BaseModel):
    device_id: str = Field(..., min_length=1, max_length=255)
    device_type: DeviceType = DeviceType.ANDROID
    device_name: Optional[str] = None
    fcm_token: Optional[str] = None


class DeviceCreate(DeviceBase):
    pass


class DeviceUpdate(BaseModel):
    device_name: Optional[str] = None
    fcm_token: Optional[str] = None
    is_active: Optional[bool] = None


class Device(DeviceBase):
    id: int
    user_id: int
    last_sync_at: Optional[datetime]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    phone_number: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    is_active: Optional[bool] = None


class User(UserBase):
    id: int
    role: str
    is_active: bool
    is_verified: bool
    last_location: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    last_location_updated_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class LiveLocationUpdate(BaseModel):
    latitude: float
    longitude: float
    location_name: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None


class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    icon: Optional[str] = None
    color: Optional[str] = None
    parent_id: Optional[int] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    icon: Optional[str] = None
    color: Optional[str] = None
    parent_id: Optional[int] = None
    is_active: Optional[bool] = None


class Category(CategoryBase):
    id: int
    user_id: int
    is_default: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CategoryWithStats(Category):
    transaction_count: int = 0
    total_amount: Decimal = Decimal("0")


class TransactionBase(BaseModel):
    amount: Decimal = Field(..., gt=0, max_digits=12, decimal_places=2)
    currency: str = Field(default="INR", min_length=3, max_length=3)
    type: TransactionType
    category_id: Optional[int] = None
    description: Optional[str] = None
    merchant_name: Optional[str] = None
    location: Optional[str] = None
    verified_location: Optional[str] = None
    verified_latitude: Optional[Decimal] = None
    verified_longitude: Optional[Decimal] = None
    transaction_date: date


class TransactionCreate(TransactionBase):
    source: TransactionSource = TransactionSource.MANUAL
    raw_message: Optional[str] = None


class TransactionUpdate(BaseModel):
    amount: Optional[Decimal] = Field(None, gt=0, max_digits=12, decimal_places=2)
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    type: Optional[TransactionType] = None
    category_id: Optional[int] = None
    description: Optional[str] = None
    merchant_name: Optional[str] = None
    location: Optional[str] = None
    verified_location: Optional[str] = None
    verified_latitude: Optional[Decimal] = None
    verified_longitude: Optional[Decimal] = None
    transaction_date: Optional[date] = None
    status: Optional[TransactionStatus] = None


class Transaction(TransactionBase):
    id: int
    user_id: int
    source: TransactionSource
    status: TransactionStatus
    parsed_confidence: Optional[Decimal]
    raw_message: Optional[str]
    location: Optional[str] = None
    verified_location: Optional[str] = None
    verified_latitude: Optional[Decimal] = None
    verified_longitude: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime
    category: Optional[Category] = None

    class Config:
        from_attributes = True


class TransactionWithCategory(Transaction):
    category: Optional[Category] = None


class TransactionSummary(BaseModel):
    total_expenses: Decimal = Decimal("0")
    total_income: Decimal = Decimal("0")
    net_amount: Decimal = Decimal("0")
    transaction_count: int = 0
    by_category: List[dict] = []
    by_merchant: List[dict] = []


class BudgetBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    amount: Decimal = Field(..., gt=0, max_digits=12, decimal_places=2)
    period: BudgetPeriod = BudgetPeriod.MONTHLY
    category_id: Optional[int] = None
    start_date: date
    end_date: Optional[date] = None


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    amount: Optional[Decimal] = Field(None, gt=0, max_digits=12, decimal_places=2)
    period: Optional[BudgetPeriod] = None
    category_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None


class Budget(BudgetBase):
    id: int
    user_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    category: Optional[Category] = None

    class Config:
        from_attributes = True


class BudgetWithProgress(Budget):
    spent_amount: Decimal = Decimal("0")
    remaining_amount: Decimal = Decimal("0")
    progress_percentage: float = 0.0


class DailyInsightBase(BaseModel):
    insight_date: date
    insight_type: InsightType
    title: str
    description: Optional[str] = None
    data: Optional[str] = None
    priority: int = 0


class DailyInsight(DailyInsightBase):
    id: int
    user_id: int
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ParsedMessageBase(BaseModel):
    source: TransactionSource
    raw_content: str
    sender: Optional[str] = None
    received_at: datetime


class ParsedMessageCreate(ParsedMessageBase):
    pass


class ParsedMessage(ParsedMessageBase):
    id: int
    user_id: int
    device_id: Optional[int]
    parsed_amount: Optional[Decimal]
    parsed_currency: Optional[str]
    parsed_merchant: Optional[str]
    parsed_category: Optional[str]
    parsed_date: Optional[date]
    parsed_type: Optional[TransactionType]
    confidence_score: Optional[Decimal]
    is_processed: bool
    transaction_id: Optional[int]
    created_at: datetime
    processed_at: Optional[datetime]

    class Config:
        from_attributes = True


class SyncRequest(BaseModel):
    device_id: str
    device_type: DeviceType
    device_name: Optional[str] = None
    fcm_token: Optional[str] = None
    messages: List[ParsedMessageCreate]


class SyncResponse(BaseModel):
    success: bool
    processed_count: int
    created_transactions: int
    errors: List[str] = []


class DashboardSummary(BaseModel):
    today_expenses: Decimal = Decimal("0")
    today_income: Decimal = Decimal("0")
    this_month_expenses: Decimal = Decimal("0")
    this_month_income: Decimal = Decimal("0")
    this_month_net: Decimal = Decimal("0")
    top_categories: List[dict] = []
    recent_transactions: List[Transaction] = []
    budget_alerts: List[BudgetWithProgress] = []
    daily_insight: Optional[DailyInsight] = None


class ChartDataPoint(BaseModel):
    date: str
    amount: float
    category: Optional[str] = None


class SpendingTrend(BaseModel):
    daily: List[ChartDataPoint] = []
    weekly: List[ChartDataPoint] = []
    monthly: List[ChartDataPoint] = []


class MerchantAnalysis(BaseModel):
    merchant: str
    total_amount: Decimal
    transaction_count: int
    average_amount: Decimal
    category: Optional[str] = None


class CategoryBreakdown(BaseModel):
    category_id: int
    category_name: str
    category_icon: Optional[str]
    category_color: Optional[str]
    total_amount: Decimal
    transaction_count: int
    percentage: float

class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class MessageResponse(BaseModel):
    message: str
