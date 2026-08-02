package com.expensetracker.app.ui.screens.settings

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.expensetracker.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onMenuClick: () -> Unit,
    onNavigateToProfile: () -> Unit,
    onNavigateToNotifications: () -> Unit,
    onNavigateToSecurity: () -> Unit,
    onNavigateToLanguage: () -> Unit,
    onNavigateToHelp: () -> Unit,
    viewModel: SettingsViewModel = hiltViewModel()
) {
    var darkMode by remember { mutableStateOf(viewModel.isDarkMode) }
    var smsSync by remember { mutableStateOf(viewModel.isSmsSync) }
    var emailSync by remember { mutableStateOf(viewModel.isEmailSync) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Settings", fontWeight = FontWeight.Bold, color = TextDark) },
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
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Profile Section
            Card(
                onClick = onNavigateToProfile,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Row(
                    modifier = Modifier.padding(20.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        modifier = Modifier.size(56.dp),
                        shape = RoundedCornerShape(16.dp),
                        color = Mint.copy(alpha = 0.1f)
                    ) {
                        Icon(
                            Icons.Default.Person,
                            contentDescription = null,
                            tint = Mint,
                            modifier = Modifier.padding(12.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(16.dp))
                    Column {
                        Text(text = "Profile Management", style = MaterialTheme.typography.titleMedium, color = TextDark, fontWeight = FontWeight.Bold)
                        Text(text = viewModel.userEmail ?: "Set up your profile", style = MaterialTheme.typography.bodySmall, color = TextMuted)
                    }
                    Spacer(modifier = Modifier.weight(1f))
                    Icon(Icons.Default.ChevronRight, contentDescription = null, tint = TextMuted)
                }
            }

            Text(text = "Preferences", style = MaterialTheme.typography.titleSmall, color = Mint, modifier = Modifier.padding(top = 8.dp))

            ToggleItem(
                icon = Icons.Default.DarkMode,
                title = "Dark Mode",
                checked = darkMode,
                onCheckedChange = { 
                    darkMode = it
                    viewModel.toggleDarkMode(it)
                }
            )

            ToggleItem(
                icon = Icons.Default.Sms,
                title = "Auto SMS Parsing",
                checked = smsSync,
                onCheckedChange = { 
                    smsSync = it
                    viewModel.toggleSmsSync(it)
                }
            )

            ToggleItem(
                icon = Icons.Default.Email,
                title = "Auto Email Sync",
                checked = emailSync,
                onCheckedChange = { 
                    emailSync = it
                    viewModel.toggleEmailSync(it)
                }
            )

            Text(text = "General", style = MaterialTheme.typography.titleSmall, color = Mint, modifier = Modifier.padding(top = 8.dp))

            SettingsItem(icon = Icons.Default.Notifications, title = "Notifications", onClick = onNavigateToNotifications)
            SettingsItem(icon = Icons.Default.Security, title = "Security", onClick = onNavigateToSecurity)
            SettingsItem(icon = Icons.Default.Language, title = "Language", onClick = onNavigateToLanguage)
            SettingsItem(icon = Icons.Default.Help, title = "Help & Support", onClick = onNavigateToHelp)

            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = { viewModel.seedData() },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = InputBackground, contentColor = Mint),
                shape = RoundedCornerShape(16.dp)
            ) {
                Icon(Icons.Default.CloudDownload, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Seed Initial Data", fontWeight = FontWeight.Bold)
            }

            Spacer(modifier = Modifier.height(8.dp))

            Button(
                onClick = { viewModel.logout() },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = Flame.copy(alpha = 0.1f), contentColor = Flame),
                shape = RoundedCornerShape(16.dp)
            ) {
                Icon(Icons.Default.Logout, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Logout", fontWeight = FontWeight.Bold)
            }
            
            Text(
                text = "Version 1.0.0",
                style = MaterialTheme.typography.labelSmall,
                color = TextMuted,
                modifier = Modifier.align(Alignment.CenterHorizontally)
            )
        }
    }
}

@Composable
fun ToggleItem(icon: ImageVector, title: String, checked: Boolean, onCheckedChange: (Boolean) -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, contentDescription = null, tint = TextDark, modifier = Modifier.size(24.dp))
        Spacer(modifier = Modifier.width(16.dp))
        Text(text = title, style = MaterialTheme.typography.bodyLarge, color = TextDark)
        Spacer(modifier = Modifier.weight(1f))
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = Color.White,
                checkedTrackColor = Mint,
                uncheckedThumbColor = TextMuted,
                uncheckedTrackColor = InputBackground
            )
        )
    }
}

@Composable
fun SettingsItem(icon: ImageVector, title: String, onClick: () -> Unit) {
    Surface(
        onClick = onClick,
        color = Color.Transparent
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(icon, contentDescription = null, tint = TextDark, modifier = Modifier.size(24.dp))
            Spacer(modifier = Modifier.width(16.dp))
            Text(text = title, style = MaterialTheme.typography.bodyLarge, color = TextDark)
            Spacer(modifier = Modifier.weight(1f))
            Icon(Icons.Default.ChevronRight, contentDescription = null, tint = TextMuted)
        }
    }
}
