package com.expensetracker.app.worker

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.expensetracker.app.data.local.AppDatabase
import com.expensetracker.app.data.local.SessionManager
import com.expensetracker.app.data.model.ParsedMessage
import com.expensetracker.app.data.model.toEntity
import com.google.gson.Gson
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@HiltWorker
class SaveParsedMessageWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val sessionManager: SessionManager
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        return withContext(Dispatchers.IO) {
            try {
                val json = inputData.getString("parsed_message") ?: return@withContext Result.failure()
                val parsed = Gson().fromJson(json, ParsedMessage::class.java)

                val userId = sessionManager.getUserId()
                if (userId != -1L) {
                    parsed.userId = userId
                }

                val db = AppDatabase.getInstance(applicationContext)
                db.parsedMessageDao().insert(parsed.toEntity())

                Result.success()
            } catch (e: Exception) {
                Result.failure()
            }
        }
    }
}
