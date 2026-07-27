package com.expensetracker.app.ui.screens.categories

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
class CategoriesViewModel @Inject constructor(
    private val repository: ApiRepository
) : ViewModel() {

    var uiState by mutableStateOf<CategoriesUiState>(CategoriesUiState.Loading)
        private set

    init {
        loadCategories()
    }

    fun loadCategories() {
        viewModelScope.launch {
            uiState = CategoriesUiState.Loading
            repository.getCategories().onSuccess { categories ->
                uiState = CategoriesUiState.Success(categories)
            }.onFailure { exception ->
                uiState = CategoriesUiState.Error(exception.message ?: "Failed to load categories")
            }
        }
    }

    fun addCategory(name: String, color: String? = null, icon: String? = null) {
        viewModelScope.launch {
            repository.createCategory(name, icon, color).onSuccess {
                loadCategories()
            }
        }
    }
}

sealed class CategoriesUiState {
    object Loading : CategoriesUiState()
    data class Success(val categories: List<Category>) : CategoriesUiState()
    data class Error(val message: String) : CategoriesUiState()
}
