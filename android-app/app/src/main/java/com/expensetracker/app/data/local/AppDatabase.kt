package com.expensetracker.app.data.local

import android.content.Context
import androidx.room.*
import com.expensetracker.app.data.model.ParsedMessage
import com.expensetracker.app.data.model.Transaction
import com.expensetracker.app.data.model.TransactionSource
import com.expensetracker.app.data.model.TransactionType
import com.expensetracker.app.data.model.Category
import com.expensetracker.app.data.model.Budget
import com.expensetracker.app.data.model.BudgetPeriod
import com.expensetracker.app.data.model.DailyInsight
import com.expensetracker.app.data.model.InsightType
import com.expensetracker.app.data.model.Device
import com.expensetracker.app.data.model.DeviceType
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneOffset
import java.util.*

@Database(
    entities = [
        User::class,
        TransactionEntity::class,
        CategoryEntity::class,
        BudgetEntity::class,
        DailyInsightEntity::class,
        DeviceEntity::class,
        ParsedMessageEntity::class
    ],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun transactionDao(): TransactionDao
    abstract fun categoryDao(): CategoryDao
    abstract fun budgetDao(): BudgetDao
    abstract fun dailyInsightDao(): DailyInsightDao
    abstract fun deviceDao(): DeviceDao
    abstract fun parsedMessageDao(): ParsedMessageDao

    companion object {
        @Volatile private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "expense_tracker_db"
                ).fallbackToDestructiveMigration().build()
                INSTANCE = instance
                instance
            }
        }
    }
}

@Entity(tableName = "users")
data class User(
    @PrimaryKey(autoGenerate = true) var id: Long = 0,
    @ColumnInfo(name = "email") val email: String,
    @ColumnInfo(name = "password_hash") val passwordHash: String,
    @ColumnInfo(name = "full_name") val fullName: String? = null,
    @ColumnInfo(name = "phone_number") val phoneNumber: String? = null,
    @ColumnInfo(name = "created_at") val createdAt: LocalDateTime = LocalDateTime.now(),
    @ColumnInfo(name = "updated_at") val updatedAt: LocalDateTime = LocalDateTime.now()
)

@Entity(
    tableName = "transactions",
    indices = [
        Index("user_id"),
        Index("transaction_date"),
        Index("category_id"),
        Index(value = ["user_id", "transaction_date"], name = "idx_user_date"),
        Index(value = ["user_id", "type", "transaction_date"], name = "idx_user_type_date"),
    ],
    foreignKeys = [
        ForeignKey(entity = User::class, parentColumns = ["id"], childColumns = ["user_id"], onDelete = ForeignKey.CASCADE),
        ForeignKey(entity = CategoryEntity::class, parentColumns = ["id"], childColumns = ["category_id"], onDelete = ForeignKey.SET_NULL),
    ]
)
data class TransactionEntity(
    @PrimaryKey(autoGenerate = true) var id: Long = 0,
    @ColumnInfo(name = "user_id") val userId: Long,
    @ColumnInfo(name = "category_id") val categoryId: Long? = null,
    @ColumnInfo(name = "amount") val amount: Double,
    @ColumnInfo(name = "currency") val currency: String = "INR",
    @ColumnInfo(name = "type") val type: TransactionType = TransactionType.EXPENSE,
    @ColumnInfo(name = "source") val source: TransactionSource = TransactionSource.MANUAL,
    @ColumnInfo(name = "status") val status: String = "confirmed",
    @ColumnInfo(name = "description") val description: String? = null,
    @ColumnInfo(name = "merchant_name") val merchantName: String? = null,
    @ColumnInfo(name = "transaction_date") val transactionDate: LocalDate,
    @ColumnInfo(name = "raw_message") val rawMessage: String? = null,
    @ColumnInfo(name = "parsed_confidence") val parsedConfidence: Double? = null,
    @ColumnInfo(name = "synced") val synced: Boolean = false,
    @ColumnInfo(name = "created_at") val createdAt: LocalDateTime = LocalDateTime.now(),
    @ColumnInfo(name = "updated_at") val updatedAt: LocalDateTime = LocalDateTime.now()
)

@Entity(
    tableName = "categories",
    indices = [Index(value = ["user_id", "name"], name = "idx_user_category_name", unique = true)],
    foreignKeys = [
        ForeignKey(entity = User::class, parentColumns = ["id"], childColumns = ["user_id"], onDelete = ForeignKey.CASCADE),
    ]
)
data class CategoryEntity(
    @PrimaryKey(autoGenerate = true) var id: Long = 0,
    @ColumnInfo(name = "user_id") val userId: Long,
    @ColumnInfo(name = "parent_id") val parentId: Long? = null,
    @ColumnInfo(name = "name") val name: String,
    @ColumnInfo(name = "icon") val icon: String? = null,
    @ColumnInfo(name = "color") val color: String? = null,
    @ColumnInfo(name = "is_default") val isDefault: Boolean = false,
    @ColumnInfo(name = "is_active") val isActive: Boolean = true,
    @ColumnInfo(name = "created_at") val createdAt: LocalDateTime = LocalDateTime.now()
)

@Entity(
    tableName = "budgets",
    foreignKeys = [
        ForeignKey(entity = User::class, parentColumns = ["id"], childColumns = ["user_id"], onDelete = ForeignKey.CASCADE),
        ForeignKey(entity = CategoryEntity::class, parentColumns = ["id"], childColumns = ["category_id"], onDelete = ForeignKey.CASCADE),
    ]
)
data class BudgetEntity(
    @PrimaryKey(autoGenerate = true) var id: Long = 0,
    @ColumnInfo(name = "user_id") val userId: Long,
    @ColumnInfo(name = "category_id") val categoryId: Long? = null,
    @ColumnInfo(name = "name") val name: String,
    @ColumnInfo(name = "amount") val amount: Double,
    @ColumnInfo(name = "period") val period: BudgetPeriod = BudgetPeriod.MONTHLY,
    @ColumnInfo(name = "start_date") val startDate: LocalDate,
    @ColumnInfo(name = "end_date") val endDate: LocalDate? = null,
    @ColumnInfo(name = "is_active") val isActive: Boolean = true,
    @ColumnInfo(name = "created_at") val createdAt: LocalDateTime = LocalDateTime.now(),
    @ColumnInfo(name = "updated_at") val updatedAt: LocalDateTime = LocalDateTime.now()
)

@Entity(
    tableName = "daily_insights",
    indices = [Index(value = ["user_id", "insight_date", "insight_type"], name = "idx_user_daily_insight", unique = true)],
    foreignKeys = [ForeignKey(entity = User::class, parentColumns = ["id"], childColumns = ["user_id"], onDelete = ForeignKey.CASCADE)]
)
data class DailyInsightEntity(
    @PrimaryKey(autoGenerate = true) var id: Long = 0,
    @ColumnInfo(name = "user_id") val userId: Long,
    @ColumnInfo(name = "insight_date") val insightDate: LocalDate,
    @ColumnInfo(name = "insight_type") val insightType: InsightType,
    @ColumnInfo(name = "title") val title: String,
    @ColumnInfo(name = "description") val description: String? = null,
    @ColumnInfo(name = "data") val data: String? = null,
    @ColumnInfo(name = "priority") val priority: Int = 0,
    @ColumnInfo(name = "is_read") val isRead: Boolean = false,
    @ColumnInfo(name = "created_at") val createdAt: LocalDateTime = LocalDateTime.now()
)

@Entity(
    tableName = "devices",
    indices = [Index(value = ["user_id", "device_id"], name = "idx_user_device", unique = true)],
    foreignKeys = [ForeignKey(entity = User::class, parentColumns = ["id"], childColumns = ["user_id"], onDelete = ForeignKey.CASCADE)]
)
data class DeviceEntity(
    @PrimaryKey(autoGenerate = true) var id: Long = 0,
    @ColumnInfo(name = "user_id") val userId: Long,
    @ColumnInfo(name = "device_id") val deviceId: String,
    @ColumnInfo(name = "device_type") val deviceType: DeviceType = DeviceType.ANDROID,
    @ColumnInfo(name = "device_name") val deviceName: String? = null,
    @ColumnInfo(name = "fcm_token") val fcmToken: String? = null,
    @ColumnInfo(name = "last_sync_at") val lastSyncAt: LocalDateTime? = null,
    @ColumnInfo(name = "is_active") val isActive: Boolean = true,
    @ColumnInfo(name = "created_at") val createdAt: LocalDateTime = LocalDateTime.now(),
    @ColumnInfo(name = "updated_at") val updatedAt: LocalDateTime = LocalDateTime.now()
)

@Entity(
    tableName = "parsed_messages",
    indices = [
        Index("user_id"),
        Index("received_at"),
        Index(value = ["user_id", "received_at"], name = "idx_user_received"),
    ],
    foreignKeys = [
        ForeignKey(entity = User::class, parentColumns = ["id"], childColumns = ["user_id"], onDelete = ForeignKey.CASCADE),
        ForeignKey(entity = DeviceEntity::class, parentColumns = ["id"], childColumns = ["device_id"], onDelete = ForeignKey.SET_NULL),
        ForeignKey(entity = TransactionEntity::class, parentColumns = ["id"], childColumns = ["transaction_id"], onDelete = ForeignKey.SET_NULL),
    ]
)
data class ParsedMessageEntity(
    @PrimaryKey(autoGenerate = true) var id: Long = 0,
    @ColumnInfo(name = "user_id") val userId: Long,
    @ColumnInfo(name = "device_id") val deviceId: Long? = null,
    @ColumnInfo(name = "source") val source: TransactionSource,
    @ColumnInfo(name = "raw_content") val rawContent: String,
    @ColumnInfo(name = "sender") val sender: String? = null,
    @ColumnInfo(name = "received_at") val receivedAt: LocalDateTime,
    @ColumnInfo(name = "parsed_amount") val parsedAmount: Double? = null,
    @ColumnInfo(name = "parsed_currency") val parsedCurrency: String? = null,
    @ColumnInfo(name = "parsed_merchant") val parsedMerchant: String? = null,
    @ColumnInfo(name = "parsed_category") val parsedCategory: String? = null,
    @ColumnInfo(name = "parsed_date") val parsedDate: LocalDate? = null,
    @ColumnInfo(name = "parsed_type") val parsedType: TransactionType? = null,
    @ColumnInfo(name = "confidence_score") val confidenceScore: Double? = null,
    @ColumnInfo(name = "is_processed") val isProcessed: Boolean = false,
    @ColumnInfo(name = "transaction_id") val transactionId: Long? = null,
    @ColumnInfo(name = "created_at") val createdAt: LocalDateTime = LocalDateTime.now(),
    @ColumnInfo(name = "processed_at") val processedAt: LocalDateTime? = null
)

class Converters {
    @TypeConverter
    fun fromLocalDateTime(value: LocalDateTime?): Long? = value?.toInstant(ZoneOffset.UTC)?.toEpochMilli()

    @TypeConverter
    fun toLocalDateTime(value: Long?): LocalDateTime? = value?.let { LocalDateTime.ofInstant(java.time.Instant.ofEpochMilli(it), ZoneOffset.UTC) }

    @TypeConverter
    fun fromLocalDate(value: LocalDate?): Long? = value?.atStartOfDay(ZoneOffset.UTC)?.toInstant()?.toEpochMilli()

    @TypeConverter
    fun toLocalDate(value: Long?): LocalDate? = value?.let { LocalDateTime.ofInstant(java.time.Instant.ofEpochMilli(it), ZoneOffset.UTC).toLocalDate() }

    @TypeConverter
    fun fromTransactionType(value: TransactionType?): String? = value?.name

    @TypeConverter
    fun toTransactionType(value: String?): TransactionType? = value?.let { TransactionType.valueOf(it) }

    @TypeConverter
    fun fromTransactionSource(value: TransactionSource?): String? = value?.name

    @TypeConverter
    fun toTransactionSource(value: String?): TransactionSource? = value?.let { TransactionSource.valueOf(it) }

    @TypeConverter
    fun fromBudgetPeriod(value: BudgetPeriod?): String? = value?.name

    @TypeConverter
    fun toBudgetPeriod(value: String?): BudgetPeriod? = value?.let { BudgetPeriod.valueOf(it) }

    @TypeConverter
    fun fromInsightType(value: InsightType?): String? = value?.name

    @TypeConverter
    fun toInsightType(value: String?): InsightType? = value?.let { InsightType.valueOf(it) }

    @TypeConverter
    fun fromDeviceType(value: DeviceType?): String? = value?.name

    @TypeConverter
    fun toDeviceType(value: String?): DeviceType? = value?.let { DeviceType.valueOf(it) }
}