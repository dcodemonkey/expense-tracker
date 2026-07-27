package com.expensetracker.app.ui.screens.dashboard

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.expensetracker.app.data.model.DashboardSummary
import com.expensetracker.app.data.repository.ApiRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val repository: ApiRepository
) : ViewModel() {

    var uiState by mutableStateOf<DashboardUiState>(DashboardUiState.Loading)
        private set

    init {
        loadDashboard()
    }

    fun loadDashboard() {
        viewModelScope.launch {
            uiState = DashboardUiState.Loading
            repository.getDashboard().onSuccess { summary ->
                uiState = DashboardUiState.Success(summary)
            }.onFailure { exception ->
                uiState = DashboardUiState.Error(exception.message ?: "Failed to load dashboard")
            }
        }
    }
}

sealed class DashboardUiState {
    object Loading : DashboardUiState()
    data class Success(val summary: DashboardSummary) : DashboardUiState()
    data class Error(val message: String) : DashboardUiState()
}
