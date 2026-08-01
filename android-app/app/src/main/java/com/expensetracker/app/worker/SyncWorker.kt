package com.expensetracker.app.worker

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequest
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.expensetracker.app.data.local.AppDatabase
import com.expensetracker.app.data.local.SessionManager
import com.expensetracker.app.data.remote.ParsedMessageRequest
import com.expensetracker.app.data.remote.SyncRequest
import com.expensetracker.app.data.repository.ApiRepository
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@HiltWorker
class SyncWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val apiRepository: ApiRepository,
    private val sessionManager: SessionManager
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        return withContext(Dispatchers.IO) {
            try {
                val db = AppDatabase.getInstance(applicationContext)
                val userId = sessionManager.getUserId()
                
                if (userId == -1L) {
                    return@withContext Result.failure()
                }

                val unsyncedMessages = db.parsedMessageDao().getUnsyncedMessages(userId)

                if (unsyncedMessages.isEmpty()) {
                    return@withContext Result.success()
                }

                val deviceId = getDeviceId(applicationContext)
                val deviceName = android.os.Build.MODEL
                val fcmToken = getFcmToken(applicationContext)

                val messages = unsyncedMessages.map { msg ->
                    ParsedMessageRequest(
                        source = msg.source.name.lowercase(),
                        rawContent = msg.rawContent,
                        sender = msg.sender,
                        receivedAt = msg.receivedAt.toString()
                    )
                }

                val syncRequest = SyncRequest(
                    deviceId = deviceId,
                    deviceType = "android",
                    deviceName = deviceName,
                    fcmToken = fcmToken,
                    messages = messages
                )

                val syncResponse = apiRepository.sync(syncRequest)

                if (syncResponse.success) {
                    val messageIds = unsyncedMessages.map { it.id }
                    db.parsedMessageDao().markAsSynced(messageIds, java.time.LocalDateTime.now())
                    Result.success()
                } else {
                    Result.retry()
                }
            } catch (e: Exception) {
                Result.retry()
            }
        }
    }

    private fun getDeviceId(context: Context): String {
        val prefs = context.getSharedPreferences("device_prefs", Context.MODE_PRIVATE)
        var deviceId = prefs.getString("device_id", null)
        if (deviceId == null) {
            deviceId = java.util.UUID.randomUUID().toString()
            prefs.edit().putString("device_id", deviceId).apply()
        }
        return deviceId
    }

    private fun getFcmToken(context: Context): String? {
        return context.getSharedPreferences("device_prefs", Context.MODE_PRIVATE)
            .getString("fcm_token", null)
    }

    companion object {
        fun enqueueSync(context: Context) {
            val workRequest = OneTimeWorkRequest.Builder(SyncWorker::class.java).build()
            WorkManager.getInstance(context).enqueueUniqueWork(
                "sync_work",
                ExistingWorkPolicy.REPLACE,
                workRequest
            )
        }
    }
}
