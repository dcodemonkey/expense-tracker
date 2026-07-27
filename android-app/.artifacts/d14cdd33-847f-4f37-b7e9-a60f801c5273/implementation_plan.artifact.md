# Implementation Plan - Transactions, Categories & UI Refinement

This plan focuses on implementing the Transactions and Categories management features and refining the overall app navigation and UI.

## User Review Required

> [!IMPORTANT]
> - **Bottom Navigation**: I will introduce a `Scaffold` with a `NavigationBar` in `MainActivity` to allow easy switching between Dashboard, Transactions, Sync, and Settings.
> - **Filtering**: The `TransactionsScreen` will include basic filtering by type (Expense/Income).

## Proposed Changes

### 1. Navigation & UI Refinement
- **[MODIFY] [MainActivity](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/ui/MainActivity.kt)**: Add a `Scaffold` with a `NavigationBar` that wraps the `AppNavHost`.
- **[MODIFY] [AppNavHost](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/ui/navigation/AppNavHost.kt)**: Add "categories" route and update navigation callbacks.

### 2. Transactions Management
- **[NEW] [TransactionsViewModel](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/ui/screens/transactions/TransactionsViewModel.kt)**: Fetches paginated transactions from the `ApiRepository`.
- **[MODIFY] [TransactionsScreen](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/ui/screens/transactions/TransactionsScreen.kt)**:
    - Implement a scrollable list of transactions.
    - Add a "Filter" chip row (All, Expense, Income).

### 3. Categories Management
- **[NEW] [CategoriesViewModel](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/ui/screens/categories/CategoriesViewModel.kt)**: Manages fetching and creating categories.
- **[NEW] [CategoriesScreen](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/ui/screens/categories/CategoriesScreen.kt)**:
    - Display a grid or list of categories.
    - Add a simple "Add Category" dialog.

### 4. Dashboard Refinement
- **[MODIFY] [DashboardScreen](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/ui/screens/dashboard/DashboardScreen.kt)**: Add navigation triggers to "View All" transactions and "Manage Categories".

## Verification Plan

### Automated Tests
- **Build**: Ensure successful compilation after all UI changes.

### Manual Verification
- Verify navigation via the new Bottom Bar.
- Verify filtering on the `TransactionsScreen`.
- Verify that adding a category on the `CategoriesScreen` updates the list.
