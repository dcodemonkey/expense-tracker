package com.expensetracker.app.service

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import androidx.work.Data
import androidx.work.OneTimeWorkRequest
import androidx.work.WorkManager
import com.expensetracker.app.data.model.ParsedMessage
import com.expensetracker.app.data.parser.SmsParser
import com.expensetracker.app.worker.SaveParsedMessageWorker
import com.expensetracker.app.worker.SyncWorker
import com.google.gson.Gson
import java.time.LocalDateTime
import java.time.ZoneOffset

class AppNotificationListenerService : NotificationListenerService() {

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)
        if (sbn == null) return

        val packageName = sbn.packageName ?: ""
        val extras = sbn.notification?.extras ?: return

        val title = extras.getString("android.title") ?: ""
        val text = extras.getCharSequence("android.text")?.toString() ?: ""
        val fullContent = "$title $text"

        // Filter for financial & UPI notification app packages in India
        val isFinancialApp = packageName.contains("gpay", ignoreCase = true) ||
                packageName.contains("phonepe", ignoreCase = true) ||
                packageName.contains("paytm", ignoreCase = true) ||
                packageName.contains("hdfc", ignoreCase = true) ||
                packageName.contains("sbi", ignoreCase = true) ||
                packageName.contains("icici", ignoreCase = true) ||
                packageName.contains("axis", ignoreCase = true) ||
                packageName.contains("bank", ignoreCase = true)

        if (isFinancialApp && text.isNotBlank()) {
            Log.d("NotificationListener", "Captured financial notification from $packageName: $fullContent")

            val receivedAt = LocalDateTime.ofInstant(
                java.time.Instant.ofEpochMilli(sbn.postTime),
                ZoneOffset.UTC
            )

            val parsed = SmsParser.parseSms(fullContent, packageName, receivedAt)
            if (parsed != null) {
                saveParsedNotification(parsed)
                scheduleSyncWork()
            }
        }
    }

    private fun saveParsedNotification(parsed: ParsedMessage) {
        val workRequest = OneTimeWorkRequest.Builder(SaveParsedMessageWorker::class.java)
            .setInputData(
                Data.Builder()
                    .putString("parsed_message", Gson().toJson(parsed))
                    .build()
            )
            .build()
        WorkManager.getInstance(applicationContext).enqueue(workRequest)
    }

    private fun scheduleSyncWork() {
        val workRequest = OneTimeWorkRequest.Builder(SyncWorker::class.java).build()
        WorkManager.getInstance(applicationContext).enqueueUniqueWork(
            "sync_work",
            androidx.work.ExistingWorkPolicy.REPLACE,
            workRequest
        )
    }
}
