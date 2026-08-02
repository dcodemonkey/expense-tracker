# Implementation Plan - Fix JSON Parsing, Theme Switching, and SMS Tracking

## Goal
Fix the `LocalDate` parsing error, implement reactive Dark Mode, and ensure the Automatic SMS Parser is correctly scheduled.

## User Review Required
> [!IMPORTANT]
> **Reactive Theme**: I am updating `SessionManager` to use a `Flow` for Dark Mode. This ensures the app theme updates **immediately** when you flip the switch, without needing a restart.
>
> **SMS Parser**: I will add logic to `MainActivity` to start the background SMS scanner automatically when you enable the feature in Settings.

## Proposed Changes

### [Core: GSON Parsing]
#### [MODIFY] [AppModule.kt](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/di/AppModule.kt)
- Add `LocalDateAdapter` and `LocalDateTimeAdapter` to handle ISO strings.
- Register them with `GsonBuilder`.

### [Core: Settings Persistence]
#### [MODIFY] [SessionManager.kt](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/data/local/SessionManager.kt)
- Convert `isDarkMode`, `isSmsSyncEnabled`, and `isEmailSyncEnabled` into `Flow`s (using `DataStore` or `SharedPreferences` listeners).
- This allows the UI and background workers to react to setting changes.

### [UI: App Theme]
#### [MODIFY] [MainActivity.kt](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/ui/MainActivity.kt)
- Observe the `darkModeFlow` from `SessionManager` to dynamically update the `ExpenseTrackerTheme`.
- Schedule/Cancel the `DailySmsScanWorker` based on the SMS Sync setting.

### [UI: Profile & Features]
#### [MODIFY] [SettingsViewModel.kt](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/ui/screens/settings/SettingsViewModel.kt)
- Implement `updateProfile` and connect it to the backend `PUT /auth/me`.

#### [MODIFY] [ProfileScreen.kt](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/ui/screens/settings/ProfileScreen.kt)
- Load current user details from `repository.getMe()` on launch.
- Enable the "Save Changes" button.

## Verification Plan
### Automated Tests
- Run `./gradlew :app:compileDebugKotlin` to verify the build.

### Manual Verification
- **JSON Fix**: Confirm Dashboard loads transactions without the "Expected BEGIN_OBJECT" error.
- **Theme**: Toggle Dark Mode and verify the UI changes color instantly.
- **Profile**: Change your name in Profile settings and verify it updates in the sidebar.
- **SMS Parser**: Enable SMS Parsing and check the "Logcat" for "DailySmsScanWorker" starting.
