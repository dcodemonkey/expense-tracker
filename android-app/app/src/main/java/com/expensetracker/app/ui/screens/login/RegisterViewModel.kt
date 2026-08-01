package com.expensetracker.app.ui.screens.login

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.expensetracker.app.data.local.SessionManager
import com.expensetracker.app.data.repository.ApiRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class RegisterViewModel @Inject constructor(
    private val repository: ApiRepository,
    private val sessionManager: SessionManager
) : ViewModel() {

    var uiState by mutableStateOf<RegisterUiState>(RegisterUiState.Idle)
        private set

    fun register(email: String, password: String, fullName: String) {
        if (email.isBlank() || password.isBlank() || fullName.isBlank()) {
            uiState = RegisterUiState.Error("All fields are required")
            return
        }

        viewModelScope.launch {
            uiState = RegisterUiState.Loading
            repository.register(email, password, fullName).onSuccess { response ->
                sessionManager.saveToken(response.accessToken)
                sessionManager.saveUserEmail(email)
                
                repository.getMe().onSuccess { user ->
                    sessionManager.saveUserId(user.id)
                    uiState = RegisterUiState.Success
                }.onFailure {
                    uiState = RegisterUiState.Success // Still proceed if me fails
                }
            }.onFailure { exception ->
                uiState = RegisterUiState.Error(exception.message ?: "Registration failed")
            }
        }
    }
}

sealed class RegisterUiState {
    object Idle : RegisterUiState()
    object Loading : RegisterUiState()
    object Success : RegisterUiState()
    data class Error(val message: String) : RegisterUiState()
}
