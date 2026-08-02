package com.expensetracker.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.expensetracker.app.ui.screens.dashboard.DashboardScreen
import com.expensetracker.app.ui.screens.login.LoginScreen
import com.expensetracker.app.ui.screens.login.RegisterScreen
import com.expensetracker.app.ui.screens.settings.SettingsScreen
import com.expensetracker.app.ui.screens.settings.ProfileScreen
import com.expensetracker.app.ui.screens.settings.PlaceholderSettingsScreen
import com.expensetracker.app.ui.screens.sync.SyncScreen
import com.expensetracker.app.ui.screens.transactions.TransactionsScreen
import com.expensetracker.app.ui.screens.transactions.TimelineScreen
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
        composable("timeline") {
            TimelineScreen(onMenuClick = onOpenDrawer)
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
            SettingsScreen(
                onMenuClick = onOpenDrawer,
                onNavigateToProfile = { navController.navigate("profile") },
                onNavigateToNotifications = { navController.navigate("notifications") },
                onNavigateToSecurity = { navController.navigate("security") },
                onNavigateToLanguage = { navController.navigate("language") },
                onNavigateToHelp = { navController.navigate("help") }
            )
        }
        composable("profile") {
            ProfileScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }
        composable("notifications") {
            PlaceholderSettingsScreen("Notifications", onNavigateBack = { navController.popBackStack() })
        }
        composable("security") {
            PlaceholderSettingsScreen("Security", onNavigateBack = { navController.popBackStack() })
        }
        composable("language") {
            PlaceholderSettingsScreen("Language", onNavigateBack = { navController.popBackStack() })
        }
        composable("help") {
            PlaceholderSettingsScreen("Help & Support", onNavigateBack = { navController.popBackStack() })
        }
    }
}
