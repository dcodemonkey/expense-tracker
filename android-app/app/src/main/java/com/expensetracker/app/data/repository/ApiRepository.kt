package com.expensetracker.app.data.repository

import android.content.Context
import dagger.hilt.android.qualifiers.ApplicationContext
import com.expensetracker.app.data.remote.*
import com.expensetracker.app.data.model.*
import com.expensetracker.app.data.parser.SmsParser
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.time.LocalDateTime
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ApiRepository @Inject constructor(
    private val apiService: ApiService,
    @ApplicationContext private val context: Context
) {

    suspend fun register(email: String, password: String, fullName: String? = null, phoneNumber: String? = null): Result<AuthResponse> {
        return try {
            val response = apiService.register(RegisterRequest(email, password, fullName, phoneNumber))
            if (response.success) Result.success(response.data!!) else Result.failure(Exception(response.error ?: "Registration failed"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun login(email: String, password: String): Result<AuthResponse> {
        return try {
            val response = apiService.login(LoginRequest(email, password))
            if (response.success) Result.success(response.data!!) else Result.failure(Exception(response.error ?: "Login failed"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getMe(): Result<UserResponse> {
        return try {
            val response = apiService.getMe()
            if (response.success) Result.success(response.data!!) else Result.failure(Exception(response.error ?: "Failed to get user"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateMe(fullName: String? = null, phoneNumber: String? = null): Result<UserResponse> {
        return try {
            val response = apiService.updateMe(UpdateUserRequest(fullName, phoneNumber))
            if (response.success) Result.success(response.data!!) else Result.failure(Exception(response.error ?: "Update failed"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getCategories(): Result<List<Category>> {
        return try {
            val response = apiService.getCategories()
            if (response.success) Result.success(response.data!!) else Result.failure(Exception(response.error ?: "Failed to get categories"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createCategory(name: String, icon: String? = null, color: String? = null, parentId: Long? = null): Result<Category> {
        return try {
            val response = apiService.createCategory(CreateCategoryRequest(name, icon, color, parentId))
            if (response.success) Result.success(response.data!!) else Result.failure(Exception(response.error ?: "Failed to create category"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getTransactions(
        startDate: String? = null,
        endDate: String? = null,
        categoryId: Long? = null,
        type: String? = null,
        merchant: String? = null,
        skip: Int = 0,
        limit: Int = 50
    ): Result<PaginatedResponse<Transaction>> {
        return try {
            val response = apiService.getTransactions(startDate, endDate, categoryId, type, merchant, skip, limit)
            if (response.success) Result.success(response.data!!) else Result.failure(Exception(response.error ?: "Failed to get transactions"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createTransaction(
        amount: Double,
        currency: String = "INR",
        type: String,
        categoryId: Long? = null,
        description: String? = null,
        merchantName: String? = null,
        transactionDate: String,
        source: String = "manual",
        rawMessage: String? = null
    ): Result<Transaction> {
        return try {
            val request = CreateTransactionRequest(amount, currency, type, categoryId, description, merchantName, transactionDate, source, rawMessage)
            val response = apiService.createTransaction(request)
            if (response.success) Result.success(response.data!!) else Result.failure(Exception(response.error ?: "Failed to create transaction"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getTransactionSummary(startDate: String? = null, endDate: String? = null): Result<TransactionSummary> {
        return try {
            val response = apiService.getTransactionSummary(startDate, endDate)
            if (response.success) Result.success(response.data!!) else Result.failure(Exception(response.error ?: "Failed to get summary"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateTransaction(id: Long, amount: Double? = null, type: String? = null, categoryId: Long? = null, description: String? = null, merchantName: String? = null, transactionDate: String? = null, status: String? = null): Result<Transaction> {
        return try {
            val response = apiService.updateTransaction(id, UpdateTransactionRequest(amount, type = type, categoryId = categoryId, description = description, merchantName = merchantName, transactionDate = transactionDate, status = status))
            if (response.success) Result.success(response.data!!) else Result.failure(Exception(response.error ?: "Failed to update transaction"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteTransaction(id: Long): Result<Unit> {
        return try {
            val response = apiService.deleteTransaction(id)
            if (response.success) Result.success(Unit) else Result.failure(Exception(response.error ?: "Failed to delete transaction"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getBudgets(): Result<List<BudgetWithProgress>> {
        return try {
            val response = apiService.getBudgets()
            if (response.success) Result.success(response.data!!) else Result.failure(Exception(response.error ?: "Failed to get budgets"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createBudget(name: String, amount: Double, period: String, categoryId: Long? = null, startDate: String, endDate: String? = null): Result<Budget> {
        return try {
            val response = apiService.createBudget(CreateBudgetRequest(name, amount, period, categoryId, startDate, endDate))
            if (response.success) Result.success(response.data!!) else Result.failure(Exception(response.error ?: "Failed to create budget"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateBudget(id: Long, name: String? = null, amount: Double? = null, period: String? = null, categoryId: Long? = null, startDate: String? = null, endDate: String? = null, isActive: Boolean? = null): Result<Budget> {
        return try {
            val response = apiService.updateBudget(id, UpdateBudgetRequest(name, amount, period, categoryId, startDate, endDate, isActive))
            if (response.success) Result.success(response.data!!) else Result.failure(Exception(response.error ?: "Failed to update budget"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteBudget(id: Long): Result<Unit> {
        return try {
            val response = apiService.deleteBudget(id)
            if (response.success) Result.success(Unit) else Result.failure(Exception(response.error ?: "Failed to delete budget"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getDashboard(): Result<DashboardSummary> {
        return try {
            val response = apiService.getDashboard()
            if (response.success) Result.success(response.data!!) else Result.failure(Exception(response.error ?: "Failed to get dashboard"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getSpendingTrend(days: Int = 30): Result<SpendingTrend> {
        return try {
            val response = apiService.getSpendingTrend(days)
            if (response.success) Result.success(response.data!!) else Result.failure(Exception(response.error ?: "Failed to get trend"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun seedData(): Result<SeedResponse> {
        return try {
            val response = apiService.seedData()
            if (response.success) Result.success(response.data!!) else Result.failure(Exception(response.error ?: "Failed to seed data"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun forgotPassword(email: String): Result<String> {
        return try {
            val response = apiService.forgotPassword(ForgotPasswordRequest(email))
            if (response.success) Result.success(response.data?.message ?: "Check your email") else Result.failure(Exception(response.error ?: "Failed to send reset email"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun sync(request: SyncRequest): SyncResponse {
        return try {
            val response = apiService.syncDevice(request)
            if (response.success && response.data != null) {
                response.data
            } else {
                SyncResponse(success = false, processed_count = 0, created_transactions = 0, errors = listOf(response.error ?: "Sync failed"))
            }
        } catch (e: Exception) {
            SyncResponse(success = false, processed_count = 0, created_transactions = 0, errors = listOf(e.message ?: "Sync error"))
        }
    }

    suspend fun parseAndSaveMessage(content: String, sender: String, receivedAt: LocalDateTime): ParsedMessage? {
        return SmsParser.parseSms(content, sender, receivedAt)
    }
}


