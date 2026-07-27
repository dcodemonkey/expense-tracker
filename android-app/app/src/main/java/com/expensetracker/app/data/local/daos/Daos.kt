package com.expensetracker.app.data.local

import androidx.room.*
import com.expensetracker.app.data.model.*
import java.time.LocalDate
import java.time.LocalDateTime

@Dao
interface UserDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(user: User): Long

    @Query("SELECT * FROM users WHERE id = :id")
    suspend fun getById(id: Long): User?

    @Query("SELECT * FROM users WHERE email = :email")
    suspend fun getByEmail(email: String): User?

    @Query("SELECT * FROM users WHERE phone_number = :phone")
    suspend fun getByPhone(phone: String): User?

    @Update
    suspend fun update(user: User)

    @Delete
    suspend fun delete(user: User)
}

@Dao
interface TransactionDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(transaction: TransactionEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(transactions: List<TransactionEntity>)

    @Query("SELECT * FROM transactions WHERE id = :id")
    suspend fun getById(id: Long): TransactionEntity?

    @Query("SELECT * FROM transactions WHERE user_id = :userId ORDER BY transaction_date DESC, created_at DESC LIMIT :limit OFFSET :offset")
    suspend fun getByUserId(userId: Long, limit: Int, offset: Int): List<TransactionEntity>

    @Query("SELECT * FROM transactions WHERE user_id = :userId AND transaction_date BETWEEN :startDate AND :endDate ORDER BY transaction_date DESC, created_at DESC")
    suspend fun getByUserIdAndDateRange(userId: Long, startDate: LocalDate, endDate: LocalDate): List<TransactionEntity>

    @Query("SELECT * FROM transactions WHERE user_id = :userId AND type = :type ORDER BY transaction_date DESC")
    suspend fun getByUserIdAndType(userId: Long, type: TransactionType): List<TransactionEntity>

    @Query("SELECT * FROM transactions WHERE user_id = :userId AND category_id = :categoryId ORDER BY transaction_date DESC")
    suspend fun getByUserIdAndCategory(userId: Long, categoryId: Long): List<TransactionEntity>

    @Query("SELECT * FROM transactions WHERE user_id = :userId AND merchant_name LIKE :merchant ORDER BY transaction_date DESC")
    suspend fun getByUserIdAndMerchant(userId: Long, merchant: String): List<TransactionEntity>

    @Query("SELECT COUNT(*) FROM transactions WHERE user_id = :userId")
    suspend fun getCountByUserId(userId: Long): Int

    @Query("SELECT SUM(amount) FROM transactions WHERE user_id = :userId AND type = :type AND transaction_date BETWEEN :startDate AND :endDate")
    suspend fun getSumByUserIdAndTypeAndDateRange(userId: Long, type: TransactionType, startDate: LocalDate, endDate: LocalDate): Double?

    @Query("SELECT SUM(amount) FROM transactions WHERE user_id = :userId AND type = :type AND category_id = :categoryId AND transaction_date BETWEEN :startDate AND :endDate")
    suspend fun getSumByCategoryAndDateRange(userId: Long, type: TransactionType, categoryId: Long, startDate: LocalDate, endDate: LocalDate): Double?

    @Query("SELECT SUM(amount) FROM transactions WHERE user_id = :userId AND type = :type AND transaction_date = :date")
    suspend fun getSumByDate(userId: Long, type: TransactionType, date: LocalDate): Double?

    @Query("SELECT category_id, SUM(amount) as total FROM transactions WHERE user_id = :userId AND type = 'EXPENSE' AND transaction_date BETWEEN :startDate AND :endDate GROUP BY category_id ORDER BY total DESC LIMIT :limit")
    suspend fun getTopCategoriesByAmount(userId: Long, startDate: LocalDate, endDate: LocalDate, limit: Int): List<CategoryAmount>

    @Query("SELECT merchant_name, SUM(amount) as total, COUNT(*) as count FROM transactions WHERE user_id = :userId AND type = 'EXPENSE' AND merchant_name IS NOT NULL AND transaction_date BETWEEN :startDate AND :endDate GROUP BY merchant_name ORDER BY total DESC LIMIT :limit")
    suspend fun getTopMerchants(userId: Long, startDate: LocalDate, endDate: LocalDate, limit: Int): List<MerchantAmount>

    @Query("SELECT category_id, categories.name as name, categories.icon as icon, categories.color as color, SUM(transactions.amount) as total, COUNT(*) as count FROM transactions JOIN categories ON transactions.category_id = categories.id WHERE transactions.user_id = :userId AND transactions.type = 'EXPENSE' AND transactions.transaction_date BETWEEN :startDate AND :endDate GROUP BY category_id ORDER BY total DESC")
    suspend fun getCategoryBreakdown(userId: Long, startDate: LocalDate, endDate: LocalDate): List<CategoryBreakdown>

    @Update
    suspend fun update(transaction: TransactionEntity)

    @Delete
    suspend fun delete(transaction: TransactionEntity)

    @Query("DELETE FROM transactions WHERE id = :id")
    suspend fun deleteById(id: Long)

    @Query("SELECT * FROM transactions WHERE user_id = :userId AND synced = 0 ORDER BY created_at ASC LIMIT :limit")
    suspend fun getUnsyncedTransactions(userId: Long, limit: Int): List<TransactionEntity>

    @Query("UPDATE transactions SET synced = 1 WHERE id IN (:ids)")
    suspend fun markAsSynced(ids: List<Long>)
}

data class CategoryAmount(
    @ColumnInfo(name = "category_id") val categoryId: Long,
    @ColumnInfo(name = "total") val total: Double
)

data class MerchantAmount(
    @ColumnInfo(name = "merchant_name") val merchantName: String,
    @ColumnInfo(name = "total") val total: Double,
    @ColumnInfo(name = "count") val count: Int
)

data class CategoryBreakdown(
    @ColumnInfo(name = "category_id") val categoryId: Long,
    val name: String,
    val icon: String?,
    val color: String?,
    val total: Double,
    val count: Int
)

@Dao
interface CategoryDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(category: CategoryEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(categories: List<CategoryEntity>)

    @Query("SELECT * FROM categories WHERE id = :id")
    suspend fun getById(id: Long): CategoryEntity?

    @Query("SELECT * FROM categories WHERE user_id = :userId AND is_active = 1 ORDER BY name")
    suspend fun getByUserId(userId: Long): List<CategoryEntity>

    @Query("SELECT * FROM categories WHERE user_id = :userId AND is_default = 1 ORDER BY name")
    suspend fun getDefaultCategories(userId: Long): List<CategoryEntity>

    @Query("SELECT * FROM categories WHERE user_id = :userId AND name = :name")
    suspend fun getByUserIdAndName(userId: Long, name: String): CategoryEntity?

    @Update
    suspend fun update(category: CategoryEntity)

    @Delete
    suspend fun delete(category: CategoryEntity)

    @Query("DELETE FROM categories WHERE id = :id")
    suspend fun deleteById(id: Long)
}

@Dao
interface BudgetDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(budget: BudgetEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(budgets: List<BudgetEntity>)

    @Query("SELECT * FROM budgets WHERE id = :id")
    suspend fun getById(id: Long): BudgetEntity?

    @Query("SELECT * FROM budgets WHERE user_id = :userId AND is_active = 1 ORDER BY created_at DESC")
    suspend fun getByUserId(userId: Long): List<BudgetEntity>

    @Query("SELECT * FROM budgets WHERE user_id = :userId AND category_id = :categoryId AND is_active = 1 ORDER BY created_at DESC")
    suspend fun getByUserIdAndCategory(userId: Long, categoryId: Long): List<BudgetEntity>

    @Query("SELECT * FROM budgets WHERE user_id = :userId AND start_date <= :date AND (end_date IS NULL OR end_date >= :date) AND is_active = 1 ORDER BY created_at DESC")
    suspend fun getActiveBudgetsForDate(userId: Long, date: LocalDate): List<BudgetEntity>

    @Update
    suspend fun update(budget: BudgetEntity)

    @Delete
    suspend fun delete(budget: BudgetEntity)

    @Query("DELETE FROM budgets WHERE id = :id")
    suspend fun deleteById(id: Long)
}

@Dao
interface DailyInsightDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(insight: DailyInsightEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(insights: List<DailyInsightEntity>)

    @Query("SELECT * FROM daily_insights WHERE id = :id")
    suspend fun getById(id: Long): DailyInsightEntity?

    @Query("SELECT * FROM daily_insights WHERE user_id = :userId AND insight_date BETWEEN :startDate AND :endDate ORDER BY insight_date DESC, priority DESC")
    suspend fun getByUserIdAndDateRange(userId: Long, startDate: LocalDate, endDate: LocalDate): List<DailyInsightEntity>

    @Query("SELECT * FROM daily_insights WHERE user_id = :userId AND insight_date = :date ORDER BY priority DESC LIMIT 1")
    suspend fun getLatestForDate(userId: Long, date: LocalDate): DailyInsightEntity?

    @Update
    suspend fun update(insight: DailyInsightEntity)

    @Delete
    suspend fun delete(insight: DailyInsightEntity)
}

@Dao
interface DeviceDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(device: DeviceEntity): Long

    @Query("SELECT * FROM devices WHERE id = :id")
    suspend fun getById(id: Long): DeviceEntity?

    @Query("SELECT * FROM devices WHERE device_id = :deviceId AND user_id = :userId")
    suspend fun getByDeviceIdAndUserId(deviceId: String, userId: Long): DeviceEntity?

    @Query("SELECT * FROM devices WHERE user_id = :userId ORDER BY created_at DESC")
    suspend fun getByUserId(userId: Long): List<DeviceEntity>

    @Update
    suspend fun update(device: DeviceEntity)

    @Delete
    suspend fun delete(device: DeviceEntity)

    @Query("DELETE FROM devices WHERE device_id = :deviceId AND user_id = :userId")
    suspend fun deleteByDeviceIdAndUserId(deviceId: String, userId: Long)
}

@Dao
interface ParsedMessageDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(message: ParsedMessageEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(messages: List<ParsedMessageEntity>)

    @Query("SELECT * FROM parsed_messages WHERE id = :id")
    suspend fun getById(id: Long): ParsedMessageEntity?

    @Query("SELECT * FROM parsed_messages WHERE user_id = :userId AND is_processed = 0 ORDER BY received_at DESC LIMIT :limit")
    suspend fun getUnsyncedMessages(userId: Long, limit: Int = 100): List<ParsedMessageEntity>

    @Query("SELECT * FROM parsed_messages WHERE user_id = :userId ORDER BY received_at DESC LIMIT :limit OFFSET :offset")
    suspend fun getByUserId(userId: Long, limit: Int, offset: Int): List<ParsedMessageEntity>

    @Query("UPDATE parsed_messages SET is_processed = 1, processed_at = :processedAt, transaction_id = :transactionId WHERE id IN (:ids)")
    suspend fun markAsSynced(ids: List<Long>, processedAt: LocalDateTime, transactionId: Long? = null)

    @Update
    suspend fun update(message: ParsedMessageEntity)

    @Delete
    suspend fun delete(message: ParsedMessageEntity)
}