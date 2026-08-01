package com.expensetracker.app.ui.screens.insights

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.expensetracker.app.data.model.CategoryBreakdown
import com.expensetracker.app.data.model.MerchantAnalysis
import com.expensetracker.app.data.model.SpendingTrend
import com.expensetracker.app.data.repository.ApiRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class InsightsViewModel @Inject constructor(
    private val repository: ApiRepository
) : ViewModel() {

    var uiState by mutableStateOf<InsightsUiState>(InsightsUiState.Loading)
        private set

    init {
        loadData()
    }

    fun loadData() {
        viewModelScope.launch {
            uiState = InsightsUiState.Loading
            
            val trendDeferred = async { repository.getSpendingTrend(30) }
            // Note: We don't have separate repo methods for merchant/category yet, 
            // but we can add them or use the dashboard summary for now if needed.
            // For now, let's just use the spending trend as the primary insight.

            val trendResult = trendDeferred.await()

            if (trendResult.isSuccess) {
                uiState = InsightsUiState.Success(
                    trend = trendResult.getOrNull()!!,
                    categories = emptyList(), // Will implement later
                    merchants = emptyList() // Will implement later
                )
            } else {
                uiState = InsightsUiState.Error(trendResult.exceptionOrNull()?.message ?: "Failed to load insights")
            }
        }
    }
}

sealed class InsightsUiState {
    object Loading : InsightsUiState()
    data class Success(
        val trend: SpendingTrend,
        val categories: List<CategoryBreakdown>,
        val merchants: List<MerchantAnalysis>
    ) : InsightsUiState()
    data class Error(val message: String) : InsightsUiState()
}
