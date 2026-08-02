package com.expensetracker.app.ui.screens.transactions

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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.expensetracker.app.data.model.Transaction
import com.expensetracker.app.data.model.TransactionSource
import com.expensetracker.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TimelineScreen(
    onMenuClick: () -> Unit,
    viewModel: TransactionsViewModel = hiltViewModel()
) {
    val uiState = viewModel.uiState

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Financial Timeline", fontWeight = FontWeight.Bold, color = TextDark) },
                navigationIcon = {
                    IconButton(onClick = onMenuClick) {
                        Icon(Icons.Default.Menu, contentDescription = "Menu", tint = TextDark)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        when (uiState) {
            is TransactionsUiState.Loading -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Mint)
                }
            }
            is TransactionsUiState.Success -> {
                TimelineList(
                    transactions = uiState.transactions,
                    modifier = Modifier.padding(padding)
                )
            }
            is TransactionsUiState.Error -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(text = uiState.message, color = Flame)
                }
            }
        }
    }
}

@Composable
fun TimelineList(transactions: List<Transaction>, modifier: Modifier = Modifier) {
    LazyColumn(
        modifier = modifier.fillMaxSize().padding(horizontal = 24.dp),
        contentPadding = PaddingValues(vertical = 24.dp)
    ) {
        items(transactions) { transaction ->
            TimelineItem(transaction)
        }
    }
}

@Composable
fun TimelineItem(transaction: Transaction) {
    Row(
        modifier = Modifier.fillMaxWidth().height(IntrinsicSize.Min),
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Timeline Connector
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.fillMaxHeight().width(40.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(
                        when (transaction.source) {
                            TransactionSource.SMS -> Mint.copy(alpha = 0.1f)
                            TransactionSource.EMAIL -> Violet.copy(alpha = 0.1f)
                            else -> TextMuted.copy(alpha = 0.1f)
                        }
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = when (transaction.source) {
                        TransactionSource.SMS -> Icons.Default.Sms
                        TransactionSource.EMAIL -> Icons.Default.Email
                        else -> Icons.Default.History
                    },
                    contentDescription = null,
                    tint = when (transaction.source) {
                        TransactionSource.SMS -> Mint
                        TransactionSource.EMAIL -> Violet
                        else -> TextMuted
                    },
                    modifier = Modifier.size(20.dp)
                )
            }
            Box(
                modifier = Modifier
                    .width(2.dp)
                    .weight(1f)
                    .background(Hairline)
            )
        }

        // Content
        Card(
            modifier = Modifier.weight(1f).padding(bottom = 24.dp),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = transaction.merchantName ?: "General Transaction",
                        fontWeight = FontWeight.Bold,
                        color = TextDark,
                        fontSize = 14.sp
                    )
                    Text(
                        text = "₹${transaction.amount}",
                        fontWeight = FontWeight.ExtraBold,
                        color = if (transaction.type.name == "INCOME") Mint else Flame,
                        fontSize = 14.sp
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = transaction.transactionDate.toString(),
                    color = TextMuted,
                    fontSize = 11.sp
                )
                if (transaction.description != null) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = transaction.description!!,
                        color = TextMuted,
                        fontSize = 12.sp,
                        maxLines = 2
                    )
                }
            }
        }
    }
}
