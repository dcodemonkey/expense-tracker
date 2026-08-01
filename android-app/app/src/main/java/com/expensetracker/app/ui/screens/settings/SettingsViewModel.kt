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

    fun logout() {
        sessionManager.clearSession()
    }

    fun seedData() {
        viewModelScope.launch {
            repository.seedData()
        }
    }
}
