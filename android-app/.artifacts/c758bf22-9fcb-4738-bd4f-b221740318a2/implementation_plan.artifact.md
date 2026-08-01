# Implementation Plan - Web UI Parity for Android

This plan aims to bring the Android application to full feature and aesthetic parity with the existing Web Dashboard. This includes advanced analytics, budget tracking, and a refined "Modern Dark" design system.

## User Review Required

> [!IMPORTANT]
> **Major UI Overhaul**: This update replaces the basic dashboard with a high-fidelity version featuring a "Net this month" hero card and custom sparkline charts.
>
> **New Permissions**: The "Insights" screen may request location data if we port the "WeatherWidget" from web, though I will prioritize financial features first.

## Proposed Changes

### 1. Data Layer & API
Update the networking layer to support all backend endpoints used by the Web UI.

#### [MODIFY] [ApiService.kt](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/data/remote/ApiService.kt)
- Add `POST /auth/seed` for demo data generation.
- Add `POST /auth/forgot-password` and `POST /auth/reset-password`.
- Add `PUT` and `DELETE` methods for Transactions and Budgets.

#### [MODIFY] [ApiRepository.kt](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/data/repository/ApiRepository.kt)
- Wrap new API calls in `Result` objects for ViewModel consumption.

---

### 2. Design System (Web Parity)
Port the Tailwind-based color palette to Compose.

#### [MODIFY] [Color.kt](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/ui/theme/Color.kt)
- Define `Flame` (Red-Orange for expenses), `Violet`, and refined `TextHi`/`TextLo` shades.

---

### 3. Advanced Dashboard (Screen 1)
Replace the current list-heavy dashboard with the "Hero" layout from Web.

#### [MODIFY] [DashboardScreen.kt](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/ui/screens/dashboard/DashboardScreen.kt)
- **Hero Card**: Implement "Net this month" with a dynamic Income/Spent progress bar.
- **Custom Sparkline**: Create a Canvas-based `AreaChart` component to show daily spending trends.
- **Metric Tiles**: Add StatCards for "Today's spend", "Today's income", etc.
- **Budget Alerts**: Integration section for nearing limits.

---

### 4. Budgets Management (Screen 2)
A new dedicated screen for managing spending limits.

#### [NEW] `BudgetsScreen.kt` & `BudgetsViewModel.kt`
- Card-based list of active budgets with "Days Left" and "Percentage Used" progress bars.
- BottomSheet or Dialog for Adding/Editing budgets.
- Category selection matching the web's icons.

---

### 5. Analytics & Insights (Screen 3)
A new tabbed screen for deep-dive analysis.

#### [NEW] `InsightsScreen.kt` & `InsightsViewModel.kt`
- **Trends Tab**: Full-screen Area Chart of spending over time.
- **Categories Tab**: Breakdown with percentage bars.
- **Merchants Tab**: List of top spending locations.

---

### 6. Transaction Details & Forms (Screens 4 & 5)
Enhance transaction control.

#### [NEW] `AddTransactionScreen.kt`
- Manual entry form for Amount, Category, Date, and Merchant.
#### [NEW] `TransactionDetailScreen.kt`
- View raw SMS (if available), edit details, or delete the record.

---

### 7. Auth Flow Completion
#### [NEW] `RegisterScreen.kt`
- Full registration form.
#### [NEW] `ForgotPasswordScreen.kt`
- Email-based reset flow.

---

## Verification Plan

### Automated Tests
- `ApiRepositoryTest`: Verify new CRUD methods for Budgets and Transactions.
- `SmsParserTest`: Ensure Indian bank UPI notifications are correctly parsed (critical for parity).

### Manual Verification
1. **Dashboard Hero**: Verify "Net this month" calculation matches web dashboard exactly.
2. **Chart Rendering**: Confirm Sparkline renders smoothly on different screen sizes.
3. **Budget Sync**: Create a budget on Android and verify it appears on the Web Dashboard instantly.
4. **Offline Mode**: Ensure "Mock Login" still works for quick testing without backend.
