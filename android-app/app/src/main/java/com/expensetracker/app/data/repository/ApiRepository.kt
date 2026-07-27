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
            val response = apiService.login(email, password)
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

    suspend fun getBudgets(): Result<List<BudgetWithProgress>> {
        return try {
            val response = apiService.getBudgets()
            if (response.success) Result.success(response.data!!) else Result.failure(Exception(response.error ?: "Failed to get budgets"))
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


