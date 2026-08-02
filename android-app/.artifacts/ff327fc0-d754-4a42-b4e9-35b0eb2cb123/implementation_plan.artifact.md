# Implementation Plan - Advanced Feature Completion & Backend Sync

## Goal
Resolve API mismatches, overhaul UI, implement Dark Mode, and establish a robust multi-source synchronization system (SMS & Email) including backend support.

## User Review Required

> [!IMPORTANT]
> **Email Synchronization Strategy**:
> - **Backend-Side**: I will implement an `EmailSyncService` on the Python backend using `imaplib`. This will securely connect to the user's mail server to fetch and parse transaction notifications.
> - **Privacy**: This requires the user to provide an "App Password" (for Gmail/Outlook). I will add secure storage fields to the `User` model on the backend.

> [!CAUTION]
> **API Change**: I am switching the app to **Direct JSON Parsing**. If the backend changes back to a wrapped format (`{success: true, data: [...]}`), the app will break. Please ensure the backend stays consistent with raw JSON responses for production.

## Proposed Changes

### [Backend: Python/FastAPI]
#### [MODIFY] [models/__init__.py](file:///D:/Projects/expense-tracker/backend/app/models/__init__.py)
- Add fields to `User` model: `email_sync_enabled`, `imap_server`, `imap_port`, `email_sync_app_password`.

#### [NEW] [services/email_parser.py](file:///D:/Projects/expense-tracker/backend/app/services/email_parser.py)
- Logic to extract transaction data from standard bank email notifications (HDFC, SBI, ICICI, etc.).

#### [NEW] [services/email_sync_service.py](file:///D:/Projects/expense-tracker/backend/app/services/email_sync_service.py)
- IMAP client to fetch unread emails and pass them through the `email_parser`.

#### [NEW] [api/v1/endpoints/email_sync.py](file:///D:/Projects/expense-tracker/backend/app/api/v1/endpoints/email_sync.py)
- Endpoints to configure email credentials and trigger manual sync.

---

### [Android: Data & Network]
#### [MODIFY] [ApiService.kt](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/data/remote/ApiService.kt)
- **Fix Deserialization**: Update all methods to return direct types (e.g., `List<Transaction>`) instead of `ApiResponse<T>`.
- **Add Profile & Sync Endpoints**: Add `PUT /auth/me`, `POST /sync/email/config`, and `POST /sync/email/trigger`.

#### [MODIFY] [ApiRepository.kt](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/data/repository/ApiRepository.kt)
- Update logic to handle direct responses and properly map filter types (lowercase).

---

### [Android: UI & Features]
#### [MODIFY] [Theme.kt](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/ui/theme/Theme.kt)
- Implement **Auto-Switching Dark Mode** controlled via `SessionManager`.

#### [NEW] [ic_launcher_foreground.xml](file:///D:/Projects/expense-tracker/android-app/app/src/main/res/drawable/ic_launcher_foreground.xml)
- Create a professional **Mint & Violet Wallet icon**.

#### [NEW] [ProfileScreen.kt](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/ui/screens/settings/ProfileScreen.kt)
- Full profile management with Email/Password/Phone updates.

#### [NEW] [TimelineScreen.kt](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/ui/screens/transactions/TimelineScreen.kt)
- Visual history of transactions with icons for SMS, Email, and Manual sources.

#### [MODIFY] [SettingsScreen.kt](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/ui/screens/settings/SettingsScreen.kt)
- Add functional toggles and configuration for Email Sync and SMS Parser.

## Verification Plan
### Automated Tests
- Run `./gradlew :app:compileDebugKotlin`
- Run backend tests (if any) or verify endpoint start.

### Manual Verification
- **App Icon**: Verify icon appears in launcher.
- **Login/Dashboard**: Verify data loads without "Expected BEGIN_OBJECT" errors.
- **Email Sync**: Enable sync, provide mock credentials, and verify unread "transaction" emails populate the timeline.
