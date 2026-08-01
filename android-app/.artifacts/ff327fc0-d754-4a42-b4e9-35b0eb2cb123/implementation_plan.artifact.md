# Implementation Plan - Web-like UI Redesign and Login Fix

## Goal
Redesign the Android app UI to match the "web mobile view" experience provided in the screenshots and fix the HTTP 422 login error.

## User Review Required
> [!IMPORTANT]
> The UI overhaul will switch the app to a light theme by default (to match the screenshot) and replace the Bottom Navigation Bar with a Navigation Drawer for a more "web-like" sidebar experience.

## Proposed Changes

### [Theme & Styling]
#### [MODIFY] [Color.kt](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/ui/theme/Color.kt)
- Add light theme colors: `LightBackground`, `CardWhite`, `InputBackground`, `TextDark`, `TextMuted`.

#### [MODIFY] [Theme.kt](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/ui/theme/Theme.kt)
- Update `DarkColorScheme` and `LightColorScheme` to use the new colors.
- Ensure `ExpenseTrackerTheme` uses the new light scheme as the primary design to match the screenshot.

### [Login & Registration Screens]
#### [MODIFY] [LoginScreen.kt](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/ui/screens/login/LoginScreen.kt)
- Redesign the layout:
    - Wallet icon with a gradient background at the top.
    - "Welcome back" / "Sign in to your ledger" titles.
    - Centered Card container for the form.
    - Text fields with labels above them.
    - Softer "Mint" primary button.
    - Footer links for registration and password reset.

#### [MODIFY] [RegisterScreen.kt](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/ui/screens/login/RegisterScreen.kt)
- Apply similar styling changes to match the login screen.

### [Navigation Overhaul]
#### [MODIFY] [MainActivity.kt](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/ui/MainActivity.kt)
- Replace `Scaffold` with a `ModalNavigationDrawer`.
- Implement a custom `DrawerContent` that matches the second screenshot.

### [Data & Network]
#### [MODIFY] [ApiService.kt](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/data/remote/ApiService.kt)
- Updated `LoginRequest` to use `username` instead of `email` to fix the 422 validation error.

## Verification Plan
### Automated Tests
- Run `./gradlew :app:compileDebugKotlin` to verify the build.
- Deploy to emulator.

### Manual Verification
- Verify that the login text fields are visible and follow the new design.
- Attempt to login with a valid account (check if 422 is resolved).
- Open the navigation drawer and verify it matches the "Ledger" sidebar from the screenshot.
