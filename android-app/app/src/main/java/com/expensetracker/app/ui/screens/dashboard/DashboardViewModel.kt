package com.expensetracker.app.ui.screens.dashboard

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.expensetracker.app.data.model.DashboardSummary
import com.expensetracker.app.data.model.SpendingTrend
import com.expensetracker.app.data.repository.ApiRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
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
            
            val summaryDeferred = async { repository.getDashboard() }
            val trendDeferred = async { repository.getSpendingTrend(30) }

            val summaryResult = summaryDeferred.await()
            val trendResult = trendDeferred.await()

            if (summaryResult.isSuccess) {
                uiState = DashboardUiState.Success(
                    summary = summaryResult.getOrNull()!!,
                    trend = trendResult.getOrNull()
                )
            } else {
                uiState = DashboardUiState.Error(summaryResult.exceptionOrNull()?.message ?: "Failed to load dashboard")
            }
        }
    }
}

sealed class DashboardUiState {
    object Loading : DashboardUiState()
    data class Success(
        val summary: DashboardSummary,
        val trend: SpendingTrend? = null
    ) : DashboardUiState()
    data class Error(val message: String) : DashboardUiState()
}
