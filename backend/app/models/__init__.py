from sqlalchemy import Column, Integer, String, DateTime, Enum as SQLEnum, ForeignKey, Numeric, Date, Text, Boolean, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    phone_number = Column(String(20), unique=True, index=True, nullable=True)
    role = Column(SQLEnum(UserRole), default=UserRole.USER, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    last_location = Column(String(255), nullable=True)
    latitude = Column(Numeric(10, 7), nullable=True)
    longitude = Column(Numeric(10, 7), nullable=True)
    last_location_updated_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="user", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="user", cascade="all, delete-orphan")
    devices = relationship("Device", back_populates="user", cascade="all, delete-orphan")
    insights = relationship("DailyInsight", back_populates="user", cascade="all, delete-orphan")


class TransactionType(str, enum.Enum):
    EXPENSE = "expense"
    INCOME = "income"
    TRANSFER = "transfer"


class TransactionSource(str, enum.Enum):
    SMS = "sms"
    EMAIL = "email"
    MANUAL = "manual"
    IMPORT = "import"


class TransactionStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)

    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default="INR", nullable=False)
    type = Column(SQLEnum(TransactionType), nullable=False, index=True)
    source = Column(SQLEnum(TransactionSource), default=TransactionSource.MANUAL, nullable=False)
    status = Column(SQLEnum(TransactionStatus), default=TransactionStatus.CONFIRMED, nullable=False)

    description = Column(Text, nullable=True)
    merchant_name = Column(String(255), nullable=True, index=True)
    location = Column(String(255), nullable=True)
    verified_location = Column(String(255), nullable=True)
    verified_latitude = Column(Numeric(10, 7), nullable=True)
    verified_longitude = Column(Numeric(10, 7), nullable=True)
    transaction_date = Column(Date, nullable=False, index=True)
    raw_message = Column(Text, nullable=True)
    parsed_confidence = Column(Numeric(3, 2), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")

    __table_args__ = (
        Index("ix_transactions_user_date", "user_id", "transaction_date"),
        Index("ix_transactions_user_type_date", "user_id", "type", "transaction_date"),
    )


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=True)

    name = Column(String(100), nullable=False)
    icon = Column(String(50), nullable=True)
    color = Column(String(7), nullable=True)
    is_default = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="categories")
    transactions = relationship("Transaction", back_populates="category")
    subcategories = relationship("Category", backref="parent", remote_side=[id])

    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_user_category_name"),
    )


class BudgetPeriod(str, enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=True)

    name = Column(String(100), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    period = Column(SQLEnum(BudgetPeriod), default=BudgetPeriod.MONTHLY, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="budgets")
    category = relationship("Category")


class DeviceType(str, enum.Enum):
    ANDROID = "android"
    IOS = "ios"
    WEB = "web"


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    device_id = Column(String(255), unique=True, index=True, nullable=False)
    device_type = Column(SQLEnum(DeviceType), default=DeviceType.ANDROID, nullable=False)
    device_name = Column(String(255), nullable=True)
    fcm_token = Column(String(500), nullable=True)
    last_sync_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="devices")

    __table_args__ = (
        UniqueConstraint("user_id", "device_id", name="uq_user_device"),
    )


class InsightType(str, enum.Enum):
    DAILY_SUMMARY = "daily_summary"
    WEEKLY_SUMMARY = "weekly_summary"
    MONTHLY_SUMMARY = "monthly_summary"
    CATEGORY_BREAKDOWN = "category_breakdown"
    MERCHANT_ANALYSIS = "merchant_analysis"
    BUDGET_ALERT = "budget_alert"
    ANOMALY_DETECTION = "anomaly_detection"
    SPENDING_TREND = "spending_trend"


class DailyInsight(Base):
    __tablename__ = "daily_insights"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    insight_date = Column(Date, nullable=False, index=True)
    insight_type = Column(SQLEnum(InsightType), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    data = Column(Text, nullable=True)
    priority = Column(Integer, default=0, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="insights")

    __table_args__ = (
        UniqueConstraint("user_id", "insight_date", "insight_type", name="uq_user_daily_insight"),
        Index("ix_daily_insights_user_date_priority", "user_id", "insight_date", "priority"),
    )


class ParsedMessage(Base):
    __tablename__ = "parsed_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    device_id = Column(Integer, ForeignKey("devices.id", ondelete="SET NULL"), nullable=True)

    source = Column(SQLEnum(TransactionSource), nullable=False)
    raw_content = Column(Text, nullable=False)
    sender = Column(String(255), nullable=True)
    received_at = Column(DateTime(timezone=True), nullable=False)

    parsed_amount = Column(Numeric(12, 2), nullable=True)
    parsed_currency = Column(String(3), nullable=True)
    parsed_merchant = Column(String(255), nullable=True)
    parsed_category = Column(String(100), nullable=True)
    parsed_date = Column(Date, nullable=True)
    parsed_type = Column(SQLEnum(TransactionType), nullable=True)
    confidence_score = Column(Numeric(3, 2), nullable=True)

    is_processed = Column(Boolean, default=False, nullable=False)
    transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    processed_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("ix_parsed_messages_user_received", "user_id", "received_at"),
    )

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # SHA-256 hex of the opaque token — the raw value is never stored.
    token_hash = Column(String(64), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User")
