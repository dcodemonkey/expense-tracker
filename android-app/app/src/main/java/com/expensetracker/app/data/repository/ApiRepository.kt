package com.expensetracker.app.data.repository

import android.content.Context
import dagger.hilt.android.qualifiers.ApplicationContext
import com.expensetracker.app.data.remote.*
import com.expensetracker.app.data.model.*
import com.expensetracker.app.data.parser.SmsParser
import com.google.gson.Gson
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
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
    private val gson = Gson()

    private fun <T> parseError(e: Exception): Result<T> {
        return try {
            if (e is retrofit2.HttpException) {
                val errorBody = e.response()?.errorBody()?.string() ?: return Result.failure(e)
                val jsonElement = JsonParser.parseString(errorBody)
                val message = if (jsonElement is JsonObject && jsonElement.has("detail")) {
                    val detail = jsonElement.get("detail")
                    if (detail.isJsonArray) {
                        detail.asJsonArray.firstOrNull()?.asJsonObject?.get("msg")?.asString ?: "Validation error"
                    } else {
                        detail.asString
                    }
                } else {
                    e.message()
                }
                Result.failure(Exception(message))
            } else {
                Result.failure(e)
            }
        } catch (inner: Exception) {
            Result.failure(e)
        }
    }

    suspend fun register(email: String, password: String, fullName: String? = null, phoneNumber: String? = null): Result<AuthResponse> {
        return try {
            Result.success(apiService.register(RegisterRequest(email, password, fullName, phoneNumber)))
        } catch (e: Exception) {
            parseError(e)
        }
    }

    suspend fun login(email: String, password: String): Result<AuthResponse> {
        return try {
            val response = apiService.login(email, password)
            if (response.accessToken.isNotEmpty()) {
                Result.success(response)
            } else {
                Result.failure(Exception("Invalid response from server"))
            }
        } catch (e: Exception) {
            parseError(e)
        }
    }

    suspend fun getMe(): Result<UserResponse> {
        return try {
            Result.success(apiService.getMe())
        } catch (e: Exception) {
            parseError(e)
        }
    }

    suspend fun updateMe(fullName: String? = null, phoneNumber: String? = null): Result<UserResponse> {
        return try {
            Result.success(apiService.updateMe(UpdateUserRequest(fullName, phoneNumber)))
        } catch (e: Exception) {
            parseError(e)
        }
    }

    suspend fun getCategories(): Result<List<Category>> {
        return try {
            Result.success(apiService.getCategories())
        } catch (e: Exception) {
            parseError(e)
        }
    }

    suspend fun createCategory(name: String, icon: String? = null, color: String? = null, parentId: Long? = null): Result<Category> {
        return try {
            Result.success(apiService.createCategory(CreateCategoryRequest(name, icon, color, parentId)))
        } catch (e: Exception) {
            parseError(e)
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
    ): Result<List<Transaction>> {
        return try {
            val formattedType = type?.lowercase()
            Result.success(apiService.getTransactions(startDate, endDate, categoryId, formattedType, merchant, skip, limit))
        } catch (e: Exception) {
            parseError(e)
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
            val request = CreateTransactionRequest(amount, currency, type.lowercase(), categoryId, description, merchantName, transactionDate, source, rawMessage)
            Result.success(apiService.createTransaction(request))
        } catch (e: Exception) {
            parseError(e)
        }
    }

    suspend fun getTransactionSummary(startDate: String? = null, endDate: String? = null): Result<TransactionSummary> {
        return try {
            Result.success(apiService.getTransactionSummary(startDate, endDate))
        } catch (e: Exception) {
            parseError(e)
        }
    }

    suspend fun updateTransaction(id: Long, amount: Double? = null, type: String? = null, categoryId: Long? = null, description: String? = null, merchantName: String? = null, transactionDate: String? = null, status: String? = null): Result<Transaction> {
        return try {
            Result.success(apiService.updateTransaction(id, UpdateTransactionRequest(amount, type = type?.lowercase(), categoryId = categoryId, description = description, merchantName = merchantName, transactionDate = transactionDate, status = status)))
        } catch (e: Exception) {
            parseError(e)
        }
    }

    suspend fun deleteTransaction(id: Long): Result<Unit> {
        return try {
            apiService.deleteTransaction(id)
            Result.success(Unit)
        } catch (e: Exception) {
            parseError(e)
        }
    }

    suspend fun getBudgets(): Result<List<BudgetWithProgress>> {
        return try {
            Result.success(apiService.getBudgets())
        } catch (e: Exception) {
            parseError(e)
        }
    }

    suspend fun createBudget(name: String, amount: Double, period: String, categoryId: Long? = null, startDate: String, endDate: String? = null): Result<Budget> {
        return try {
            Result.success(apiService.createBudget(CreateBudgetRequest(name, amount, period.lowercase(), categoryId, startDate, endDate)))
        } catch (e: Exception) {
            parseError(e)
        }
    }

    suspend fun updateBudget(id: Long, name: String? = null, amount: Double? = null, period: String? = null, categoryId: Long? = null, startDate: String? = null, endDate: String? = null, isActive: Boolean? = null): Result<Budget> {
        return try {
            Result.success(apiService.updateBudget(id, UpdateBudgetRequest(name, amount, period?.lowercase(), categoryId, startDate, endDate, isActive)))
        } catch (e: Exception) {
            parseError(e)
        }
    }

    suspend fun deleteBudget(id: Long): Result<Unit> {
        return try {
            apiService.deleteBudget(id)
            Result.success(Unit)
        } catch (e: Exception) {
            parseError(e)
        }
    }

    suspend fun getDashboard(): Result<DashboardSummary> {
        return try {
            Result.success(apiService.getDashboard())
        } catch (e: Exception) {
            parseError(e)
        }
    }

    suspend fun getSpendingTrend(days: Int = 30): Result<SpendingTrend> {
        return try {
            Result.success(apiService.getSpendingTrend(days))
        } catch (e: Exception) {
            parseError(e)
        }
    }

    suspend fun seedData(): Result<SeedResponse> {
        return try {
            Result.success(apiService.seedData())
        } catch (e: Exception) {
            parseError(e)
        }
    }

    suspend fun forgotPassword(email: String): Result<String> {
        return try {
            val response = apiService.forgotPassword(ForgotPasswordRequest(email))
            Result.success(response.message)
        } catch (e: Exception) {
            parseError(e)
        }
    }

    suspend fun sync(request: SyncRequest): SyncResponse {
        return try {
            apiService.syncDevice(request)
        } catch (e: Exception) {
            SyncResponse(success = false, processed_count = 0, created_transactions = 0, errors = listOf(e.message ?: "Sync error"))
        }
    }

    suspend fun triggerEmailSync(): Result<String> {
        return try {
            val response = apiService.triggerEmailSync()
            Result.success(response.message)
        } catch (e: Exception) {
            parseError(e)
        }
    }

    suspend fun configEmailSync(enabled: Boolean): Result<String> {
        return try {
            val response = apiService.configEmailSync(enabled)
            Result.success(response.message)
        } catch (e: Exception) {
            parseError(e)
        }
    }

    suspend fun parseAndSaveMessage(content: String, sender: String, receivedAt: LocalDateTime): ParsedMessage? {
        return SmsParser.parseSms(content, sender, receivedAt)
    }
}
