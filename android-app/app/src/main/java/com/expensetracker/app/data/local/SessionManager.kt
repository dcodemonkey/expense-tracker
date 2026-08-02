package com.expensetracker.app.data.local

import android.content.Context
import android.content.SharedPreferences
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SessionManager @Inject constructor(@ApplicationContext context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)

    private val _logoutEvents = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
    val logoutEvents = _logoutEvents.asSharedFlow()

    private val _darkModeFlow = MutableStateFlow(isDarkMode())
    val darkModeFlow = _darkModeFlow.asStateFlow()

    private val _smsSyncFlow = MutableStateFlow(isSmsSyncEnabled())
    val smsSyncFlow = _smsSyncFlow.asStateFlow()

    private val _emailSyncFlow = MutableStateFlow(isEmailSyncEnabled())
    val emailSyncFlow = _emailSyncFlow.asStateFlow()

    companion object {
        private const val PREF_NAME = "expense_tracker_prefs"
        private const val KEY_TOKEN = "access_token"
        private const val KEY_USER_EMAIL = "user_email"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_DARK_MODE = "is_dark_mode"
        private const val KEY_SMS_SYNC = "sms_sync_enabled"
        private const val KEY_EMAIL_SYNC = "email_sync_enabled"
    }

    fun saveUserId(id: Long) {
        prefs.edit().putLong(KEY_USER_ID, id).apply()
    }

    fun getUserId(): Long {
        return prefs.getLong(KEY_USER_ID, -1L)
    }

    fun saveToken(token: String) {
        prefs.edit().putString(KEY_TOKEN, token).apply()
    }

    fun getToken(): String? {
        return prefs.getString(KEY_TOKEN, null)
    }

    fun saveUserEmail(email: String) {
        prefs.edit().putString(KEY_USER_EMAIL, email).apply()
    }

    fun getUserEmail(): String? {
        return prefs.getString(KEY_USER_EMAIL, null)
    }

    fun setDarkMode(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_DARK_MODE, enabled).apply()
        _darkModeFlow.value = enabled
    }

    fun isDarkMode(): Boolean {
        return prefs.getBoolean(KEY_DARK_MODE, false)
    }

    fun setSmsSync(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_SMS_SYNC, enabled).apply()
        _smsSyncFlow.value = enabled
    }

    fun isSmsSyncEnabled(): Boolean {
        return prefs.getBoolean(KEY_SMS_SYNC, true)
    }

    fun setEmailSync(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_EMAIL_SYNC, enabled).apply()
        _emailSyncFlow.value = enabled
    }

    fun isEmailSyncEnabled(): Boolean {
        return prefs.getBoolean(KEY_EMAIL_SYNC, false)
    }

    fun clearSession() {
        prefs.edit().clear().apply()
        _logoutEvents.tryEmit(Unit)
    }

    fun isLoggedIn(): Boolean {
        return getToken() != null
    }
}
