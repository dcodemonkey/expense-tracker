package com.expensetracker.app.ui.screens.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.expensetracker.app.data.local.SessionManager
import com.expensetracker.app.data.repository.ApiRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val sessionManager: SessionManager,
    private val repository: ApiRepository
) : ViewModel() {

    val userEmail: String?
        get() = sessionManager.getUserEmail()

    val isDarkMode: Boolean
        get() = sessionManager.isDarkMode()

    val isSmsSync: Boolean
        get() = sessionManager.isSmsSyncEnabled()

    val isEmailSync: Boolean
        get() = sessionManager.isEmailSyncEnabled()

    fun logout() {
        sessionManager.clearSession()
    }

    fun toggleDarkMode(enabled: Boolean) {
        sessionManager.setDarkMode(enabled)
    }

    fun toggleSmsSync(enabled: Boolean) {
        sessionManager.setSmsSync(enabled)
    }

    fun toggleEmailSync(enabled: Boolean) {
        sessionManager.setEmailSync(enabled)
        viewModelScope.launch {
            repository.configEmailSync(enabled)
        }
    }

    fun seedData() {
        viewModelScope.launch {
            repository.seedData()
        }
    }
}
