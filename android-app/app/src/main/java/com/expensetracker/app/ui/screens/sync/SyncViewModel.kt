package com.expensetracker.app.ui.screens.sync

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.expensetracker.app.data.repository.ApiRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SyncViewModel @Inject constructor(
    private val repository: ApiRepository,
    @ApplicationContext private val context: Context
) : ViewModel() {

    var syncEnabled by mutableStateOf(false)
        private set

    var lastSyncTime by mutableStateOf("Never")
        private set

    var isSyncing by mutableStateOf(false)
        private set

    init {
        val prefs = context.getSharedPreferences("sync_prefs", Context.MODE_PRIVATE)
        syncEnabled = prefs.getBoolean("sms_sync_enabled", false)
        lastSyncTime = prefs.getString("last_sync_time", "Never") ?: "Never"
    }

    fun toggleSync(enabled: Boolean) {
        syncEnabled = enabled
        context.getSharedPreferences("sync_prefs", Context.MODE_PRIVATE)
            .edit()
            .putBoolean("sms_sync_enabled", enabled)
            .apply()
    }

    fun performManualSync() {
        viewModelScope.launch {
            isSyncing = true
            // In a real app, this would trigger the SyncWorker or call repository.syncDevice()
            // For now, we'll just simulate a delay
            kotlinx.coroutines.delay(2000)
            lastSyncTime = java.time.LocalDateTime.now().toString()
            context.getSharedPreferences("sync_prefs", Context.MODE_PRIVATE)
                .edit()
                .putString("last_sync_time", lastSyncTime)
                .apply()
            isSyncing = false
        }
    }
}
