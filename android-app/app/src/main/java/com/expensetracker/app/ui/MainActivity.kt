package com.expensetracker.app.ui

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.expensetracker.app.data.local.SessionManager
import com.expensetracker.app.ui.navigation.AppNavHost
import com.expensetracker.app.ui.theme.*
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var sessionManager: SessionManager

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        // Runtime permissions handling
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        requestPermissionsIfNeeded()

        setContent {
            val isDarkMode = sessionManager.isDarkMode()
            ExpenseTrackerTheme(darkTheme = isDarkMode) {
                MainContent(sessionManager)
            }
        }
    }

    private fun requestPermissionsIfNeeded() {
        val permissionsToRequest = mutableListOf(
            Manifest.permission.RECEIVE_SMS,
            Manifest.permission.READ_SMS
        )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissionsToRequest.add(Manifest.permission.POST_NOTIFICATIONS)
        }

        val missing = permissionsToRequest.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (missing.isNotEmpty()) {
            requestPermissionLauncher.launch(missing.toTypedArray())
        }

        checkNotificationListenerPermission()
    }

    private fun checkNotificationListenerPermission() {
        val packageName = packageName
        val flat = Settings.Secure.getString(contentResolver, "enabled_notification_listeners")
        if (flat == null || !flat.contains(packageName)) {
            try {
                startActivity(Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS"))
            } catch (e: Exception) {
                // Ignored
            }
        }
    }
}

@Composable
fun MainContent(sessionManager: SessionManager) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        sessionManager.logoutEvents.collect {
            navController.navigate("login") {
                popUpTo(0) { inclusive = true }
            }
        }
    }

    val showDrawer = currentDestination?.route !in listOf("login", "register", "forgot-password")

    if (showDrawer) {
        ModalNavigationDrawer(
            drawerState = drawerState,
            drawerContent = {
                ModalDrawerSheet(
                    drawerContainerColor = MaterialTheme.colorScheme.surface,
                    drawerShape = RoundedCornerShape(topEnd = 24.dp, bottomEnd = 24.dp)
                ) {
                    DrawerContent(
                        userEmail = sessionManager.getUserEmail(),
                        currentRoute = currentDestination?.route,
                        onNavigate = { route ->
                            scope.launch { drawerState.close() }
                            navController.navigate(route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        }
                    )
                }
            }
        ) {
            AppNavHost(
                navController = navController,
                startDestination = if (sessionManager.isLoggedIn()) "dashboard" else "login",
                onOpenDrawer = { scope.launch { drawerState.open() } }
            )
        }
    } else {
        AppNavHost(
            navController = navController,
            startDestination = if (sessionManager.isLoggedIn()) "dashboard" else "login"
        )
    }
}

@Composable
fun DrawerContent(
    userEmail: String?,
    currentRoute: String?,
    onNavigate: (String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxHeight()
            .width(300.dp)
            .padding(24.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .background(
                        Brush.linearGradient(listOf(Mint, Violet)),
                        shape = RoundedCornerShape(12.dp)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.AccountBalanceWallet, contentDescription = null, tint = Color.White, modifier = Modifier.size(20.dp))
            }
            Spacer(modifier = Modifier.width(12.dp))
            Text("Ledger", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = TextDark)
        }

        Spacer(modifier = Modifier.height(32.dp))

        val menuItems = listOf(
            DrawerItem("Dashboard", "dashboard", Icons.Default.Dashboard),
            DrawerItem("Timeline", "timeline", Icons.Default.Timeline),
            DrawerItem("Transactions", "transactions", Icons.Default.ReceiptLong),
            DrawerItem("Categories", "categories", Icons.Default.Category),
            DrawerItem("Budgets", "budgets", Icons.Default.PieChart),
            DrawerItem("Insights", "insights", Icons.Default.AutoGraph),
            DrawerItem("Settings", "settings", Icons.Default.Settings)
        )

        menuItems.forEach { item ->
            val selected = currentRoute == item.route
            NavigationDrawerItem(
                label = { Text(item.title, fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal) },
                selected = selected,
                onClick = { onNavigate(item.route) },
                icon = { Icon(item.icon, contentDescription = null) },
                colors = NavigationDrawerItemDefaults.colors(
                    selectedContainerColor = Mint.copy(alpha = 0.1f),
                    selectedIconColor = Mint,
                    selectedTextColor = Mint,
                    unselectedContainerColor = Color.Transparent,
                    unselectedIconColor = TextMuted,
                    unselectedTextColor = TextDark
                ),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.padding(vertical = 4.dp)
            )
        }

        Spacer(modifier = Modifier.weight(1f))

        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = Mint.copy(alpha = 0.1f),
            shape = RoundedCornerShape(12.dp)
        ) {
            Row(
                modifier = Modifier.padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Default.Person, contentDescription = null, tint = Mint)
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text("User Account", color = Mint, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    Text(userEmail ?: "Guest", color = Mint.copy(alpha = 0.8f), fontSize = 11.sp, maxLines = 1)
                }
            }
        }
    }
}

data class DrawerItem(
    val title: String,
    val route: String,
    val icon: ImageVector
)
