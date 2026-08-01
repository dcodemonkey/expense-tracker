package com.expensetracker.app.ui.screens.budgets

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.expensetracker.app.data.model.BudgetWithProgress
import com.expensetracker.app.data.model.Category
import com.expensetracker.app.data.repository.ApiRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class BudgetsViewModel @Inject constructor(
    private val repository: ApiRepository
) : ViewModel() {

    var uiState by mutableStateOf<BudgetsUiState>(BudgetsUiState.Loading)
        private set

    var categories by mutableStateOf<List<Category>>(emptyList())
        private set

    init {
        loadData()
    }

    fun loadData() {
        viewModelScope.launch {
            uiState = BudgetsUiState.Loading
            repository.getCategories().onSuccess { cats ->
                categories = cats
            }
            repository.getBudgets().onSuccess { budgets ->
                uiState = BudgetsUiState.Success(budgets)
            }.onFailure { e ->
                uiState = BudgetsUiState.Error(e.message ?: "Failed to load budgets")
            }
        }
    }

    fun createBudget(name: String, amount: Double, period: String, categoryId: Long?, startDate: String) {
        viewModelScope.launch {
            repository.createBudget(name, amount, period, categoryId, startDate).onSuccess {
                loadData()
            }
        }
    }

    fun deleteBudget(id: Long) {
        viewModelScope.launch {
            repository.deleteBudget(id).onSuccess {
                loadData()
            }
        }
    }
}

sealed class BudgetsUiState {
    object Loading : BudgetsUiState()
    data class Success(val budgets: List<BudgetWithProgress>) : BudgetsUiState()
    data class Error(val message: String) : BudgetsUiState()
}
