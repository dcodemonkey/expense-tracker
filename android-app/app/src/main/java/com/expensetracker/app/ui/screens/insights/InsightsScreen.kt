package com.expensetracker.app.ui.screens.insights

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.expensetracker.app.data.model.SpendingTrend
import com.expensetracker.app.ui.components.SparklineChart
import com.expensetracker.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InsightsScreen(
    onMenuClick: () -> Unit,
    viewModel: InsightsViewModel = hiltViewModel()
) {
    val uiState = viewModel.uiState
    var selectedTab by remember { mutableStateOf(0) }
    val tabs = listOf("Trends", "Categories", "Merchants")

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Insights", fontWeight = FontWeight.Bold, color = TextDark) },
                navigationIcon = {
                    IconButton(onClick = onMenuClick) {
                        Icon(Icons.Default.Menu, contentDescription = "Menu", tint = TextDark)
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.loadData() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = TextDark)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Column(modifier = Modifier.padding(padding).fillMaxSize()) {
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = MaterialTheme.colorScheme.background,
                contentColor = Mint,
                indicator = { tabPositions ->
                    TabRowDefaults.Indicator(
                        Modifier.tabIndicatorOffset(tabPositions[selectedTab]),
                        color = Mint
                    )
                },
                divider = { Divider(color = Hairline) }
            ) {
                tabs.forEachIndexed { index, title ->
                    Tab(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        text = { Text(title, style = MaterialTheme.typography.labelMedium) },
                        selectedContentColor = Mint,
                        unselectedContentColor = TextMuted
                    )
                }
            }

            when (uiState) {
                is InsightsUiState.Loading -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Mint)
                    }
                }
                is InsightsUiState.Success -> {
                    when (selectedTab) {
                        0 -> TrendContent(uiState.trend)
                        1 -> CategoriesContent()
                        2 -> MerchantsContent()
                    }
                }
                is InsightsUiState.Error -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text(text = uiState.message, color = Flame)
                    }
                }
            }
        }
    }
}

@Composable
fun TrendContent(trend: SpendingTrend) {
    val dailyData = trend.daily.map { it.amount }
    
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        item {
            Card(
                modifier = Modifier.fillMaxWidth().height(280.dp),
                shape = RoundedCornerShape(32.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(24.dp)) {
                    Text("Daily Spending", fontWeight = FontWeight.Bold, color = TextDark)
                    Text("Last 30 days", style = MaterialTheme.typography.labelSmall, color = TextMuted)
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    Box(modifier = Modifier.fillMaxSize()) {
                        SparklineChart(
                            data = dailyData,
                            modifier = Modifier.fillMaxSize(),
                            color = Mint
                        )
                    }
                }
            }
        }
        
        item {
            Text("Monthly Breakdown", fontWeight = FontWeight.Bold, color = TextDark, modifier = Modifier.padding(horizontal = 8.dp))
        }
        
        items(trend.monthly.size) { index ->
            val month = trend.monthly[index]
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(month.date, color = TextMuted)
                Text("₹${month.amount}", color = TextDark, fontWeight = FontWeight.Bold)
            }
            Divider(color = Hairline, modifier = Modifier.padding(vertical = 12.dp))
        }
    }
}

@Composable
fun CategoriesContent() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text("Category breakdown coming soon", color = TextMuted)
    }
}

@Composable
fun MerchantsContent() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text("Merchant analysis coming soon", color = TextMuted)
    }
}
