# Walkthrough - Login Debugging & Field Reversion

I have reverted the login field to `email` and enhanced the network logging to help identify why the backend is returning HTTP 422.

## Changes Made

### API Alignment
- **[ApiService.kt](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/data/remote/ApiService.kt)**: Changed `LoginRequest` to use `email` instead of `username`. This now matches the `RegisterRequest` and the standard form fields.
- **[ApiRepository.kt](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/data/repository/ApiRepository.kt)**: Updated the `login` function to pass the email input into the new `email` field of the request body.

### Debugging Enhancements
- **[NetworkModule.kt](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/di/NetworkModule.kt)**: Added logic to the `OkHttpClient` interceptor to catch HTTP 422 and 500 errors and log the **exact error message** from the server to Android Studio's **Logcat**.

## Next Steps for You

> [!IMPORTANT]
> 1. **Try Registering First**: Use the "Register Now" screen to create a completely new account. If registration works, try logging in with those same details.
> 2. **Check Logcat**: If you still get a 422 error, look at the **Logcat** tab in Android Studio and filter for `NetworkModule`. It will show the specific validation error the server is complaining about (e.g., "password too short" or "invalid email format").

render_diffs(file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/data/remote/ApiService.kt)
render_diffs(file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/di/NetworkModule.kt)
