# Implementation Plan - Debugging Login HTTP 422/500

The application is stuck between a 422 (validation error) and 500 (server crash). This plan aims to find the exact format the backend requires by adding better logging and trying the most standard formats.

## Proposed Changes

### [Component: Data & Network]

#### [MODIFY] [ApiService.kt](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/data/remote/ApiService.kt)
- Revert `LoginRequest` to use `email` (to match `RegisterRequest`).
- Keep it as a JSON `@Body` for now, as `@FormUrlEncoded` previously gave a 500 error.

#### [MODIFY] [NetworkModule.kt](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/di/NetworkModule.kt)
- Ensure the error interceptor logs the full response body for 422 and 500 errors to Logcat.

### [Component: UI - Screens]

#### [MODIFY] [LoginScreen.kt](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/ui/screens/login/LoginScreen.kt)
- Update the error message display to show a more detailed error if possible, or at least confirm the error code.

## Verification Plan

### Manual Verification
1. **Try Registration**: Use the "Register Now" screen to create a new account. If this works, it confirms the backend handles JSON and `email` correctly.
2. **Try Login**: After registering, try logging in with those credentials.
3. **Check Logcat**: If it still fails, I will need you to provide the output of Logcat filtered by `NetworkModule`.
