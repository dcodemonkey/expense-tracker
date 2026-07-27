package com.expensetracker.app.data.model

import com.google.gson.annotations.SerializedName
import java.time.LocalDate
import java.time.LocalDateTime

data class Transaction(
    @SerializedName("id") var id: Long = 0,
    @SerializedName("user_id") var userId: Long = 0,
    @SerializedName("amount") var amount: Double = 0.0,
    @SerializedName("currency") var currency: String = "INR",
    @SerializedName("type") var type: TransactionType = TransactionType.EXPENSE,
    @SerializedName("source") var source: TransactionSource = TransactionSource.MANUAL,
    @SerializedName("status") var status: String = "confirmed",
    @SerializedName("category_id") var categoryId: Long? = null,
    @SerializedName("description") var description: String? = null,
    @SerializedName("merchant_name") var merchantName: String? = null,
    @SerializedName("transaction_date") var transactionDate: LocalDate = LocalDate.now(),
    @SerializedName("raw_message") var rawMessage: String? = null,
    @SerializedName("parsed_confidence") var parsedConfidence: Double? = null,
    @SerializedName("created_at") var createdAt: LocalDateTime = LocalDateTime.now(),
    @SerializedName("updated_at") var updatedAt: LocalDateTime = LocalDateTime.now(),
    @SerializedName("synced") var synced: Boolean = false,
    @SerializedName("category") var category: Category? = null
)

enum class TransactionType {
    EXPENSE, INCOME, TRANSFER
}

enum class TransactionSource {
    SMS, EMAIL, MANUAL, IMPORT
}

data class Category(
    @SerializedName("id") var id: Long = 0,
    @SerializedName("user_id") var userId: Long = 0,
    @SerializedName("name") var name: String = "",
    @SerializedName("icon") var icon: String? = null,
    @SerializedName("color") var color: String? = null,
    @SerializedName("parent_id") var parentId: Long? = null,
    @SerializedName("is_default") var isDefault: Boolean = false,
    @SerializedName("is_active") var isActive: Boolean = true,
    @SerializedName("created_at") var createdAt: LocalDateTime = LocalDateTime.now()
)

data class Budget(
    @SerializedName("id") var id: Long = 0,
    @SerializedName("user_id") var userId: Long = 0,
    @SerializedName("category_id") var categoryId: Long? = null,
    @SerializedName("name") var name: String = "",
    @SerializedName("amount") var amount: Double = 0.0,
    @SerializedName("period") var period: BudgetPeriod = BudgetPeriod.MONTHLY,
    @SerializedName("start_date") var startDate: LocalDate = LocalDate.now(),
    @SerializedName("end_date") var endDate: LocalDate? = null,
    @SerializedName("is_active") var isActive: Boolean = true,
    @SerializedName("created_at") var createdAt: LocalDateTime = LocalDateTime.now(),
    @SerializedName("updated_at") var updatedAt: LocalDateTime = LocalDateTime.now(),
    @SerializedName("category") var category: Category? = null
)

data class BudgetWithProgress(
    @SerializedName("id") var id: Long = 0,
    @SerializedName("user_id") var userId: Long = 0,
    @SerializedName("category_id") var categoryId: Long? = null,
    @SerializedName("name") var name: String = "",
    @SerializedName("amount") var amount: Double = 0.0,
    @SerializedName("period") var period: BudgetPeriod = BudgetPeriod.MONTHLY,
    @SerializedName("start_date") var startDate: LocalDate = LocalDate.now(),
    @SerializedName("end_date") var endDate: LocalDate? = null,
    @SerializedName("is_active") var isActive: Boolean = true,
    @SerializedName("created_at") var createdAt: LocalDateTime = LocalDateTime.now(),
    @SerializedName("updated_at") var updatedAt: LocalDateTime = LocalDateTime.now(),
    @SerializedName("category") var category: Category? = null,
    @SerializedName("spent_amount") var spentAmount: Double = 0.0,
    @SerializedName("remaining_amount") var remainingAmount: Double = 0.0,
    @SerializedName("progress_percentage") var progressPercentage: Double = 0.0
)

enum class BudgetPeriod {
    DAILY, WEEKLY, MONTHLY, YEARLY
}

data class Device(
    @SerializedName("id") var id: Long = 0,
    @SerializedName("user_id") var userId: Long = 0,
    @SerializedName("device_id") var deviceId: String = "",
    @SerializedName("device_type") var deviceType: DeviceType = DeviceType.ANDROID,
    @SerializedName("device_name") var deviceName: String? = null,
    @SerializedName("fcm_token") var fcmToken: String? = null,
    @SerializedName("last_sync_at") var lastSyncAt: LocalDateTime? = null,
    @SerializedName("is_active") var isActive: Boolean = true,
    @SerializedName("created_at") var createdAt: LocalDateTime = LocalDateTime.now(),
    @SerializedName("updated_at") var updatedAt: LocalDateTime = LocalDateTime.now()
)

enum class DeviceType {
    ANDROID, IOS, WEB
}

data class DailyInsight(
    @SerializedName("id") var id: Long = 0,
    @SerializedName("user_id") var userId: Long = 0,
    @SerializedName("insight_date") var insightDate: LocalDate = LocalDate.now(),
    @SerializedName("insight_type") var insightType: InsightType = InsightType.DAILY_SUMMARY,
    @SerializedName("title") var title: String = "",
    @SerializedName("description") var description: String? = null,
    @SerializedName("data") var data: String? = null,
    @SerializedName("priority") var priority: Int = 0,
    @SerializedName("is_read") var isRead: Boolean = false,
    @SerializedName("created_at") var createdAt: LocalDateTime = LocalDateTime.now()
)

enum class InsightType {
    DAILY_SUMMARY, WEEKLY_SUMMARY, MONTHLY_SUMMARY, CATEGORY_BREAKDOWN, MERCHANT_ANALYSIS, BUDGET_ALERT, ANOMALY_DETECTION, SPENDING_TREND
}

data class ParsedMessage(
    @SerializedName("id") var id: Long = 0,
    @SerializedName("user_id") var userId: Long = 0,
    @SerializedName("device_id") var deviceId: Long? = null,
    @SerializedName("source") var source: TransactionSource = TransactionSource.SMS,
    @SerializedName("raw_content") var rawContent: String = "",
    @SerializedName("sender") var sender: String? = null,
    @SerializedName("received_at") var receivedAt: LocalDateTime = LocalDateTime.now(),
    @SerializedName("parsed_amount") var parsedAmount: Double? = null,
    @SerializedName("parsed_currency") var parsedCurrency: String? = null,
    @SerializedName("parsed_merchant") var parsedMerchant: String? = null,
    @SerializedName("parsed_category") var parsedCategory: String? = null,
    @SerializedName("parsed_date") var parsedDate: LocalDate? = null,
    @SerializedName("parsed_type") var parsedType: TransactionType? = null,
    @SerializedName("confidence_score") var confidenceScore: Double? = null,
    @SerializedName("is_processed") var isProcessed: Boolean = false,
    @SerializedName("transaction_id") var transactionId: Long? = null,
    @SerializedName("created_at") var createdAt: LocalDateTime = LocalDateTime.now(),
    @SerializedName("processed_at") var processedAt: LocalDateTime? = null
)

data class TransactionSummary(
    @SerializedName("total_expenses") val totalExpenses: Double,
    @SerializedName("total_income") val totalIncome: Double,
    @SerializedName("net_amount") val netAmount: Double,
    @SerializedName("transaction_count") val transactionCount: Int,
    @SerializedName("by_category") val byCategory: List<Map<String, Any>>,
    @SerializedName("by_merchant") val byMerchant: List<Map<String, Any>>
)

data class DashboardSummary(
    @SerializedName("today_expenses") val todayExpenses: Double,
    @SerializedName("today_income") val todayIncome: Double,
    @SerializedName("this_month_expenses") val thisMonthExpenses: Double,
    @SerializedName("this_month_income") val thisMonthIncome: Double,
    @SerializedName("this_month_net") val thisMonthNet: Double,
    @SerializedName("top_categories") val topCategories: List<Map<String, Any>>,
    @SerializedName("recent_transactions") val recentTransactions: List<Transaction>,
    @SerializedName("budget_alerts") val budgetAlerts: List<BudgetWithProgress>,
    @SerializedName("daily_insight") val dailyInsight: DailyInsight? = null
)

data class SpendingTrend(
    @SerializedName("daily") val daily: List<ChartDataPoint>,
    @SerializedName("weekly") val weekly: List<ChartDataPoint>,
    @SerializedName("monthly") val monthly: List<ChartDataPoint>
)

data class ChartDataPoint(
    @SerializedName("date") val date: String,
    @SerializedName("amount") val amount: Double,
    @SerializedName("category") val category: String? = null
)

data class MerchantAnalysis(
    @SerializedName("merchant") val merchant: String,
    @SerializedName("total_amount") val totalAmount: Double,
    @SerializedName("transaction_count") val transactionCount: Int,
    @SerializedName("average_amount") val averageAmount: Double,
    @SerializedName("category") val category: String? = null
)

data class CategoryBreakdown(
    @SerializedName("category_id") val categoryId: Int,
    @SerializedName("category_name") val categoryName: String,
    @SerializedName("category_icon") val categoryIcon: String? = null,
    @SerializedName("category_color") val categoryColor: String? = null,
    @SerializedName("total_amount") val totalAmount: Double,
    @SerializedName("transaction_count") val transactionCount: Int,
    @SerializedName("percentage") val percentage: Double
)
