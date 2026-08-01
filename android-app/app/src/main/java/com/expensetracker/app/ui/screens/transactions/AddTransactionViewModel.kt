package com.expensetracker.app.ui.screens.transactions

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.expensetracker.app.data.model.Category
import com.expensetracker.app.data.repository.ApiRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AddTransactionViewModel @Inject constructor(
    private val repository: ApiRepository
) : ViewModel() {

    var uiState by mutableStateOf<AddTransactionUiState>(AddTransactionUiState.Idle)
        private set

    var categories by mutableStateOf<List<Category>>(emptyList())
        private set

    init {
        loadCategories()
    }

    private fun loadCategories() {
        viewModelScope.launch {
            repository.getCategories().onSuccess {
                categories = it
            }
        }
    }

    fun addTransaction(
        amount: Double,
        type: String,
        categoryId: Long?,
        description: String,
        merchantName: String,
        date: String
    ) {
        viewModelScope.launch {
            uiState = AddTransactionUiState.Loading
            repository.createTransaction(
                amount = amount,
                type = type,
                categoryId = categoryId,
                description = description,
                merchantName = merchantName,
                transactionDate = date
            ).onSuccess {
                uiState = AddTransactionUiState.Success
            }.onFailure {
                uiState = AddTransactionUiState.Error(it.message ?: "Failed to add transaction")
            }
        }
    }
}

sealed class AddTransactionUiState {
    object Idle : AddTransactionUiState()
    object Loading : AddTransactionUiState()
    object Success : AddTransactionUiState()
    data class Error(val message: String) : AddTransactionUiState()
}
