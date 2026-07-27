package com.expensetracker.app.ui.screens.transactions

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.expensetracker.app.data.model.Transaction
import com.expensetracker.app.data.repository.ApiRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class TransactionsViewModel @Inject constructor(
    private val repository: ApiRepository
) : ViewModel() {

    var uiState by mutableStateOf<TransactionsUiState>(TransactionsUiState.Loading)
        private set

    var filterType by mutableStateOf<String?>(null)
        private set

    init {
        loadTransactions()
    }

    fun loadTransactions(type: String? = filterType) {
        filterType = type
        viewModelScope.launch {
            uiState = TransactionsUiState.Loading
            repository.getTransactions(type = type).onSuccess { response ->
                uiState = TransactionsUiState.Success(response.items)
            }.onFailure { exception ->
                uiState = TransactionsUiState.Error(exception.message ?: "Failed to load transactions")
            }
        }
    }
}

sealed class TransactionsUiState {
    object Loading : TransactionsUiState()
    data class Success(val transactions: List<Transaction>) : TransactionsUiState()
    data class Error(val message: String) : TransactionsUiState()
}
