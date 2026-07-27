package com.expensetracker.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.expensetracker.app.ui.screens.dashboard.DashboardScreen
import com.expensetracker.app.ui.screens.login.LoginScreen
import com.expensetracker.app.ui.screens.settings.SettingsScreen
import com.expensetracker.app.ui.screens.sync.SyncScreen
import com.expensetracker.app.ui.screens.transactions.TransactionsScreen
import com.expensetracker.app.ui.screens.categories.CategoriesScreen

@Composable
fun AppNavHost(
    navController: NavHostController,
    startDestination: String = "login"
) {
    NavHost(navController = navController, startDestination = startDestination) {
        composable("login") {
            LoginScreen(onLoginSuccess = { 
                navController.navigate("dashboard") {
                    popUpTo("login") { inclusive = true }
                }
            })
        }
        composable("dashboard") {
            DashboardScreen(
                onNavigateToTransactions = { navController.navigate("transactions") },
                onNavigateToCategories = { navController.navigate("categories") }
            )
        }
        composable("transactions") {
            TransactionsScreen()
        }
        composable("categories") {
            CategoriesScreen()
        }
        composable("sync") {
            SyncScreen()
        }
        composable("settings") {
            SettingsScreen()
        }
    }
}
