package com.expensetracker.app.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Telephony
import android.telephony.SmsMessage
import androidx.work.OneTimeWorkRequest
import androidx.work.WorkManager
import com.expensetracker.app.data.parser.SmsParser
import com.expensetracker.app.data.local.AppDatabase
import com.expensetracker.app.data.model.ParsedMessage
import com.expensetracker.app.data.model.Transaction
import com.expensetracker.app.data.model.TransactionSource
import com.expensetracker.app.worker.SaveParsedMessageWorker
import com.expensetracker.app.worker.SyncWorker
// import com.google.firebase.messaging.FirebaseMessaging
import com.google.gson.Gson
import java.time.LocalDateTime
import java.time.ZoneOffset

class SmsReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
            val bundle = intent.extras
            if (bundle != null) {
                val pdus = bundle.get("pdus") as Array<Any?>
                val format = bundle.getString("format")

                for (pdu in pdus) {
                    val smsMessage = SmsMessage.createFromPdu(pdu as ByteArray, format)
                    val sender = smsMessage.originatingAddress ?: ""
                    val body = smsMessage.messageBody ?: ""
                    val timestamp = smsMessage.timestampMillis

                    val receivedAt = LocalDateTime.ofInstant(
                        java.time.Instant.ofEpochMilli(timestamp),
                        ZoneOffset.UTC
                    )

                    val parsed = SmsParser.parseSms(body, sender, receivedAt)
                    if (parsed != null) {
                        saveParsedMessage(context, parsed)
                        scheduleSyncWork(context)
                    }
                }
            }
        }
    }

    private fun saveParsedMessage(context: Context, parsed: ParsedMessage) {
        // Save to local database using WorkManager or direct DB access
        // For now, we'll use WorkManager to handle DB operations
        val workRequest = OneTimeWorkRequest.Builder(SaveParsedMessageWorker::class.java)
            .setInputData(
                androidx.work.Data.Builder()
                    .putString("parsed_message", Gson().toJson(parsed))
                    .build()
            )
            .build()
        WorkManager.getInstance(context).enqueue(workRequest)
    }

    private fun scheduleSyncWork(context: Context) {
        val workRequest = OneTimeWorkRequest.Builder(SyncWorker::class.java)
            .build()
        WorkManager.getInstance(context).enqueueUniqueWork(
            "sync_work",
            androidx.work.ExistingWorkPolicy.REPLACE,
            workRequest
        )
    }
}