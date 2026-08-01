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
class LoginViewModel @Inject constructor(
    private val repository: ApiRepository,
    private val sessionManager: SessionManager
) : ViewModel() {

    var uiState by mutableStateOf<LoginUiState>(LoginUiState.Idle)
        private set

    fun login(email: String, password: String) {
        if (email.isBlank() || password.isBlank()) {
            uiState = LoginUiState.Error("Email and password cannot be empty")
            return
        }

        viewModelScope.launch {
            uiState = LoginUiState.Loading
            repository.login(email, password).onSuccess { response ->
                sessionManager.saveToken(response.accessToken)
                sessionManager.saveUserEmail(email)
                // Fetch user info to get the ID
                repository.getMe().onSuccess { user ->
                    sessionManager.saveUserId(user.id)
                    uiState = LoginUiState.Success
                }.onFailure {
                    uiState = LoginUiState.Error("Failed to fetch user details")
                }
            }.onFailure { exception ->
                uiState = LoginUiState.Error(exception.message ?: "Login failed")
            }
        }
    }

    fun register(email: String, password: String) {
        if (email.isBlank() || password.isBlank()) {
            uiState = LoginUiState.Error("Email and password cannot be empty")
            return
        }

        viewModelScope.launch {
            uiState = LoginUiState.Loading
            repository.register(email, password).onSuccess {
                login(email, password)
            }.onFailure { exception ->
                uiState = LoginUiState.Error(exception.message ?: "Registration failed")
            }
        }
    }

    fun resetState() {
        uiState = LoginUiState.Idle
    }
}

sealed class LoginUiState {
    object Idle : LoginUiState()
    object Loading : LoginUiState()
    object Success : LoginUiState()
    data class Error(val message: String) : LoginUiState()
}
