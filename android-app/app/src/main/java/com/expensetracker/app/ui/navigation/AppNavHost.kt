package com.expensetracker.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.expensetracker.app.ui.screens.dashboard.DashboardScreen
import com.expensetracker.app.ui.screens.login.LoginScreen
import com.expensetracker.app.ui.screens.login.RegisterScreen
import com.expensetracker.app.ui.screens.settings.SettingsScreen
import com.expensetracker.app.ui.screens.sync.SyncScreen
import com.expensetracker.app.ui.screens.transactions.TransactionsScreen
import com.expensetracker.app.ui.screens.transactions.AddTransactionScreen
import com.expensetracker.app.ui.screens.categories.CategoriesScreen
import com.expensetracker.app.ui.screens.budgets.BudgetsScreen
import com.expensetracker.app.ui.screens.insights.InsightsScreen

@Composable
fun AppNavHost(
    navController: NavHostController,
    startDestination: String = "login",
    onOpenDrawer: () -> Unit = {}
) {
    NavHost(navController = navController, startDestination = startDestination) {
        composable("login") {
            LoginScreen(
                onNavigateToRegister = { navController.navigate("register") },
                onLoginSuccess = { 
                    navController.navigate("dashboard") {
                        popUpTo("login") { inclusive = true }
                    }
                }
            )
        }
        composable("register") {
            RegisterScreen(
                onNavigateBack = { navController.popBackStack() },
                onRegisterSuccess = {
                    navController.navigate("dashboard") {
                        popUpTo("login") { inclusive = true }
                    }
                }
            )
        }
        composable("dashboard") {
            DashboardScreen(
                onNavigateToTransactions = { navController.navigate("transactions") },
                onNavigateToCategories = { navController.navigate("categories") },
                onMenuClick = onOpenDrawer
            )
        }
        composable("transactions") {
            TransactionsScreen(onMenuClick = onOpenDrawer)
        }
        composable("transactions/new") {
            AddTransactionScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }
        composable("budgets") {
            BudgetsScreen(onMenuClick = onOpenDrawer)
        }
        composable("insights") {
            InsightsScreen(onMenuClick = onOpenDrawer)
        }
        composable("categories") {
            CategoriesScreen(onMenuClick = onOpenDrawer)
        }
        composable("sync") {
            SyncScreen()
        }
        composable("settings") {
            SettingsScreen(onMenuClick = onOpenDrawer)
        }
    }
}
