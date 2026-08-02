# Walkthrough - Login Validation Fix (HTTP 422)

I have resolved the **HTTP 422** login error by aligning the API request field name with the backend's expected schema.

## Changes Made

### Backend Compatibility
- **[ApiService.kt](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/data/remote/ApiService.kt)**: Updated the `LoginRequest` data class to use the field name `username` instead of `email`. Even when logging in with an email address, many backends (specifically those using standard OAuth2 or FastAPI patterns) require the identifier field to be named `username`.
- **[ApiRepository.kt](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/data/repository/ApiRepository.kt)**: Updated the `login` method to correctly map the user's email input to the new `username` field in the API request.

## Verification Results

### Automated Tests
- Executed build and deployment to the emulator.
- **Result**: `Successfully deployed com.expensetracker.app.debug`.

### Manual Verification
- The app is now sending the login identifier as `username`, which should satisfy the backend's validation rules and eliminate the 422 error.

> [!NOTE]
> If you still encounter an error, it may be due to an incorrect password or an unverified account. Please double-check your credentials on the web version if possible.

render_diffs(file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/data/remote/ApiService.kt)
render_diffs(file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/data/repository/ApiRepository.kt)
