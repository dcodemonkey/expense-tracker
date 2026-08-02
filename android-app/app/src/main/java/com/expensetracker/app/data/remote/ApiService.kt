package com.expensetracker.app.data.remote

import com.expensetracker.app.data.model.*
import com.google.gson.annotations.SerializedName
import retrofit2.http.*

interface ApiService {
    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): AuthResponse

    @FormUrlEncoded
    @POST("auth/login")
    suspend fun login(@Field("username") email: String, @Field("password") password: String): AuthResponse

    @GET("auth/me")
    suspend fun getMe(): UserResponse

    @PUT("auth/me")
    suspend fun updateMe(@Body request: UpdateUserRequest): UserResponse

    @GET("categories")
    suspend fun getCategories(): List<Category>

    @POST("categories")
    suspend fun createCategory(@Body request: CreateCategoryRequest): Category

    @PUT("categories/{id}")
    suspend fun updateCategory(@Path("id") id: Long, @Body request: UpdateCategoryRequest): Category

    @DELETE("categories/{id}")
    suspend fun deleteCategory(@Path("id") id: Long)

    @GET("transactions")
    suspend fun getTransactions(
        @Query("start_date") startDate: String? = null,
        @Query("end_date") endDate: String? = null,
        @Query("category_id") categoryId: Long? = null,
        @Query("type") type: String? = null,
        @Query("merchant") merchant: String? = null,
        @Query("skip") skip: Int = 0,
        @Query("limit") limit: Int = 50
    ): List<Transaction>

    @POST("transactions")
    suspend fun createTransaction(@Body request: CreateTransactionRequest): Transaction

    @GET("transactions/{id}")
    suspend fun getTransaction(@Path("id") id: Long): Transaction

    @PUT("transactions/{id}")
    suspend fun updateTransaction(@Path("id") id: Long, @Body request: UpdateTransactionRequest): Transaction

    @DELETE("transactions/{id}")
    suspend fun deleteTransaction(@Path("id") id: Long)

    @GET("transactions/summary")
    suspend fun getTransactionSummary(
        @Query("start_date") startDate: String? = null,
        @Query("end_date") endDate: String? = null
    ): TransactionSummary

    @GET("budgets")
    suspend fun getBudgets(): List<BudgetWithProgress>

    @POST("budgets")
    suspend fun createBudget(@Body request: CreateBudgetRequest): Budget

    @GET("budgets/{id}")
    suspend fun getBudget(@Path("id") id: Long): Budget

    @PUT("budgets/{id}")
    suspend fun updateBudget(@Path("id") id: Long, @Body request: UpdateBudgetRequest): Budget

    @DELETE("budgets/{id}")
    suspend fun deleteBudget(@Path("id") id: Long)

    @GET("insights/dashboard")
    suspend fun getDashboard(): DashboardSummary

    @GET("insights/spending-trend")
    suspend fun getSpendingTrend(@Query("days") days: Int = 30): SpendingTrend

    @GET("insights/merchant-analysis")
    suspend fun getMerchantAnalysis(
        @Query("start_date") startDate: String? = null,
        @Query("end_date") endDate: String? = null,
        @Query("limit") limit: Int = 20
    ): List<MerchantAnalysis>

    @GET("insights/category-breakdown")
    suspend fun getCategoryBreakdown(
        @Query("start_date") startDate: String? = null,
        @Query("end_date") endDate: String? = null
    ): List<CategoryBreakdown>

    @GET("insights/daily-insights")
    suspend fun getDailyInsights(
        @Query("start_date") startDate: String? = null,
        @Query("end_date") endDate: String? = null
    ): List<DailyInsight>

    @POST("auth/seed")
    suspend fun seedData(): SeedResponse

    @POST("auth/forgot-password")
    suspend fun forgotPassword(@Body request: ForgotPasswordRequest): MessageResponse

    @POST("auth/reset-password")
    suspend fun resetPassword(@Body request: ResetPasswordRequest): MessageResponse

    @POST("sync/sync")
    suspend fun syncDevice(@Body request: SyncRequest): SyncResponse

    @GET("sync/devices")
    suspend fun getDevices(): List<Device>

    @DELETE("sync/devices/{device_id}")
    suspend fun deleteDevice(@Path("device_id") deviceId: String)

    // New Advanced Sync Endpoints
    @POST("sync/email/trigger")
    suspend fun triggerEmailSync(): MessageResponse

    @POST("sync/email/config")
    suspend fun configEmailSync(@Query("enabled") enabled: Boolean): MessageResponse
}

data class ApiResponse<T>(
    @SerializedName("success") val success: Boolean,
    @SerializedName("data") val data: T? = null,
    @SerializedName("error") val error: String? = null,
    @SerializedName("message") val message: String? = null,
    @SerializedName("detail") val detail: String? = null
)

data class PaginatedResponse<T>(
    @SerializedName("items") val items: List<T>,
    @SerializedName("total") val total: Int,
    @SerializedName("page") val page: Int,
    @SerializedName("size") val size: Int,
    @SerializedName("pages") val pages: Int
)

data class RegisterRequest(
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String,
    @SerializedName("full_name") val fullName: String? = null,
    @SerializedName("phone_number") val phoneNumber: String? = null
)

data class AuthResponse(
    @SerializedName("access_token") val accessToken: String,
    @SerializedName("token_type") val tokenType: String = "bearer"
)

data class SeedResponse(
    @SerializedName("message") val message: String,
    @SerializedName("seeded") val seeded: Boolean,
    @SerializedName("transactions") val transactions: Int,
    @SerializedName("categories") val categories: Int,
    @SerializedName("budgets") val budgets: Int
)

data class ForgotPasswordRequest(
    @SerializedName("email") val email: String
)

data class ResetPasswordRequest(
    @SerializedName("token") val token: String,
    @SerializedName("new_password") val newPassword: String
)

data class MessageResponse(
    @SerializedName("message") val message: String
)

data class UserResponse(
    @SerializedName("id") val id: Long,
    @SerializedName("email") val email: String,
    @SerializedName("full_name") val fullName: String? = null,
    @SerializedName("phone_number") val phoneNumber: String? = null,
    @SerializedName("role") val role: String = "user",
    @SerializedName("is_active") val isActive: Boolean = true,
    @SerializedName("is_verified") val isVerified: Boolean = false,
    @SerializedName("created_at") val createdAt: String
)

data class UpdateUserRequest(
    @SerializedName("full_name") val fullName: String? = null,
    @SerializedName("phone_number") val phoneNumber: String? = null,
    @SerializedName("is_active") val isActive: Boolean? = null
)

data class CreateCategoryRequest(
    @SerializedName("name") val name: String,
    @SerializedName("icon") val icon: String? = null,
    @SerializedName("color") val color: String? = null,
    @SerializedName("parent_id") val parentId: Long? = null
)

data class UpdateCategoryRequest(
    @SerializedName("name") val name: String? = null,
    @SerializedName("icon") val icon: String? = null,
    @SerializedName("color") val color: String? = null,
    @SerializedName("parent_id") val parentId: Long? = null,
    @SerializedName("is_active") val isActive: Boolean? = null
)

data class CreateTransactionRequest(
    @SerializedName("amount") val amount: Double,
    @SerializedName("currency") val currency: String = "INR",
    @SerializedName("type") val type: String,
    @SerializedName("category_id") val categoryId: Long? = null,
    @SerializedName("description") val description: String? = null,
    @SerializedName("merchant_name") val merchantName: String? = null,
    @SerializedName("transaction_date") val transactionDate: String,
    @SerializedName("source") val source: String = "manual",
    @SerializedName("raw_message") val rawMessage: String? = null
)

data class UpdateTransactionRequest(
    @SerializedName("amount") val amount: Double? = null,
    @SerializedName("currency") val currency: String? = null,
    @SerializedName("type") val type: String? = null,
    @SerializedName("category_id") val categoryId: Long? = null,
    @SerializedName("description") val description: String? = null,
    @SerializedName("merchant_name") val merchantName: String? = null,
    @SerializedName("transaction_date") val transactionDate: String? = null,
    @SerializedName("status") val status: String? = null
)

data class CreateBudgetRequest(
    @SerializedName("name") val name: String,
    @SerializedName("amount") val amount: Double,
    @SerializedName("period") val period: String,
    @SerializedName("category_id") val categoryId: Long? = null,
    @SerializedName("start_date") val startDate: String,
    @SerializedName("end_date") val endDate: String? = null
)

data class UpdateBudgetRequest(
    @SerializedName("name") val name: String? = null,
    @SerializedName("amount") val amount: Double? = null,
    @SerializedName("period") val period: String? = null,
    @SerializedName("category_id") val categoryId: Long? = null,
    @SerializedName("start_date") val startDate: String? = null,
    @SerializedName("end_date") val endDate: String? = null,
    @SerializedName("is_active") val isActive: Boolean? = null
)

data class ParsedMessageRequest(
    @SerializedName("source") val source: String,
    @SerializedName("raw_content") val rawContent: String,
    @SerializedName("sender") val sender: String? = null,
    @SerializedName("received_at") val receivedAt: String
)

data class SyncRequest(
    @SerializedName("device_id") val deviceId: String,
    @SerializedName("device_type") val deviceType: String,
    @SerializedName("device_name") val deviceName: String? = null,
    @SerializedName("fcm_token") val fcmToken: String? = null,
    @SerializedName("messages") val messages: List<ParsedMessageRequest>
)

data class SyncResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("processed_count") val processed_count: Int,
    @SerializedName("created_transactions") val created_transactions: Int,
    @SerializedName("errors") val errors: List<String> = emptyList()
)
