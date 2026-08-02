package com.expensetracker.app.ui.screens.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.expensetracker.app.data.model.DashboardSummary
import com.expensetracker.app.ui.components.HeroCard
import com.expensetracker.app.ui.components.StatCard
import com.expensetracker.app.ui.components.TransactionItem
import com.expensetracker.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    onNavigateToTransactions: () -> Unit,
    onNavigateToCategories: () -> Unit,
    onMenuClick: () -> Unit,
    viewModel: DashboardViewModel = hiltViewModel()
) {
    val uiState = viewModel.uiState

    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Column {
                        Text("Good afternoon,", style = MaterialTheme.typography.labelSmall, color = TextMuted)
                        Text("Developer", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = TextDark)
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onMenuClick) {
                        Icon(Icons.Default.Menu, contentDescription = "Menu", tint = TextDark)
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.loadDashboard() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = TextDark)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        when (uiState) {
            is DashboardUiState.Loading -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Mint)
                }
            }
            is DashboardUiState.Success -> {
                DashboardContent(
                    state = uiState,
                    onViewAllTransactions = onNavigateToTransactions,
                    modifier = Modifier.padding(padding)
                )
            }
            is DashboardUiState.Error -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(text = "Sync Error or Empty Data", color = Flame, fontWeight = FontWeight.Bold)
                        Text(text = uiState.message, color = TextMuted, fontSize = 12.sp)
                        Button(onClick = { viewModel.loadDashboard() }, modifier = Modifier.padding(top = 16.dp)) {
                            Text("Retry Sync")
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun DashboardContent(
    state: DashboardUiState.Success,
    onViewAllTransactions: () -> Unit,
    modifier: Modifier = Modifier
) {
    val summary = state.summary
    val trendData = state.trend?.daily?.map { it.amount } ?: emptyList()

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        item {
            HeroCard(
                netAmount = summary.thisMonthNet.toDouble(),
                income = summary.thisMonthIncome.toDouble(),
                expenses = summary.thisMonthExpenses.toDouble(),
                trendData = trendData
            )
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                StatCard(
                    label = "Total Savings",
                    value = "₹${summary.thisMonthNet}",
                    icon = Icons.Default.Savings,
                    color = Mint,
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    label = "Credit Available",
                    value = "₹50,000", // Mock for now, will link to email sync result
                    icon = Icons.Default.CreditCard,
                    color = Violet,
                    modifier = Modifier.weight(1f)
                )
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Recent activity",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = TextDark
                )
                TextButton(onClick = onViewAllTransactions) {
                    Text("All", color = Mint)
                }
            }
        }

        if (summary.recentTransactions.isEmpty()) {
            item {
                Box(
                    modifier = Modifier.fillMaxWidth().padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No transactions tracked yet", color = TextMuted)
                }
            }
        } else {
            items(summary.recentTransactions.take(5)) { transaction ->
                TransactionItem(transaction)
            }
        }

        if (summary.budgetAlerts.isNotEmpty()) {
            item {
                Text(
                    text = "Budget alerts",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = Flame,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }
            items(summary.budgetAlerts) { budget ->
                BudgetAlertItem(budget)
            }
        }
    }
}

@Composable
fun BudgetAlertItem(budget: com.expensetracker.app.data.model.BudgetWithProgress) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        border = CardDefaults.outlinedCardBorder().copy(brush = SolidColor(Flame.copy(alpha = 0.3f)))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(text = budget.name, fontWeight = FontWeight.Bold, color = TextDark)
                Text(
                    text = "${budget.progressPercentage.toInt()}%",
                    color = Flame,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            LinearProgressIndicator(
                progress = (budget.progressPercentage / 100f).toFloat().coerceIn(0f, 1f),
                modifier = Modifier.fillMaxWidth().height(6.dp).clip(CircleShape),
                color = Flame,
                trackColor = Color.Black.copy(alpha = 0.05f)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "₹${budget.spentAmount} of ₹${budget.amount}",
                style = MaterialTheme.typography.labelSmall,
                color = TextMuted
            )
        }
    }
}
