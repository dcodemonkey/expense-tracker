package com.expensetracker.app.worker

import android.content.Context
import android.net.Uri
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.expensetracker.app.data.local.AppDatabase
import com.expensetracker.app.data.model.toEntity
import com.expensetracker.app.data.parser.SmsParser
import java.time.LocalDateTime
import java.time.ZoneOffset

class DailySmsScanWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        Log.d("DailySmsScanWorker", "Starting End-of-Day SMS scan for ALL transactions (Debits & Credits)...")

        val context = applicationContext
        val contentResolver = context.contentResolver
        val uri = Uri.parse("content://sms/inbox")

        // Scan messages received in the last 24 hours
        val last24HoursMillis = System.currentTimeMillis() - (24 * 60 * 60 * 1000)

        val projection = arrayOf("_id", "address", "body", "date")
        val selection = "date >= ?"
        val selectionArgs = arrayOf(last24HoursMillis.toString())
        val sortOrder = "date DESC"

        val db = AppDatabase.getInstance(context)
        val parsedDao = db.parsedMessageDao()

        var scannedCount = 0
        var addedCount = 0

        try {
            contentResolver.query(uri, projection, selection, selectionArgs, sortOrder)?.use { cursor ->
                val addressIdx = cursor.getColumnIndex("address")
                val bodyIdx = cursor.getColumnIndex("body")
                val dateIdx = cursor.getColumnIndex("date")

                while (cursor.moveToNext()) {
                    val address = cursor.getString(addressIdx) ?: ""
                    val body = cursor.getString(bodyIdx) ?: ""
                    val dateMillis = cursor.getLong(dateIdx)

                    scannedCount++

                    // Check if SMS contains ANY financial transaction keywords (Debits OR Credits)
                    val isFinancialTransaction = body.contains("debited", ignoreCase = true) ||
                            body.contains("spent", ignoreCase = true) ||
                            body.contains("paid", ignoreCase = true) ||
                            body.contains("transferred", ignoreCase = true) ||
                            body.contains("vpa", ignoreCase = true) ||
                            body.contains("credited", ignoreCase = true) ||
                            body.contains("received", ignoreCase = true) ||
                            body.contains("deposited", ignoreCase = true) ||
                            body.contains("salary", ignoreCase = true) ||
                            body.contains("refund", ignoreCase = true) ||
                            body.contains("cashback", ignoreCase = true) ||
                            body.contains("reversal", ignoreCase = true)

                    if (isFinancialTransaction) {
                        val receivedAt = LocalDateTime.ofInstant(
                            java.time.Instant.ofEpochMilli(dateMillis),
                            ZoneOffset.UTC
                        )

                        val parsed = SmsParser.parseSms(body, address, receivedAt)
                        if (parsed != null) {
                            parsedDao.insert(parsed.toEntity())
                            addedCount++
                        }
                    }
                }
            }

            Log.d("DailySmsScanWorker", "Scan completed. Scanned: $scannedCount, Processed Debits & Credits: $addedCount")

            // Trigger immediate sync to Vercel Backend
            SyncWorker.enqueueSync(context)

            return Result.success()
        } catch (e: Exception) {
            Log.e("DailySmsScanWorker", "Error scanning SMS inbox for transactions", e)
            return Result.failure()
        }
    }
}
