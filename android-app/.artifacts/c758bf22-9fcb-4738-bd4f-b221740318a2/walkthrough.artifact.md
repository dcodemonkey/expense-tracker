# Fix: IllegalAccessError and Project Cleanup

The `java.lang.IllegalAccessError` during build was caused by the Kotlin Annotation Processing Tool (kapt) attempting to access internal Java compiler classes (`com.sun.tools.javac`) which are encapsulated in newer JDKs.

I have resolved this by migrating the project to **Kotlin Symbol Processing (KSP)** and updating the build configuration.

## Key Changes

### 1. Build Configuration Update
- **Kotlin Migration**: Updated Kotlin from `1.9.10` to `1.9.20` and Compose Compiler extension to `1.5.4`.
- **KSP Integration**: Replaced `kapt` with `ksp` for **Room** and **Hilt** to avoid internal Java compiler dependency.
- **JVM Arguments**: Updated [gradle.properties](file:///D:/Projects/expense-tracker/android-app/gradle.properties) with `--add-opens` flags to ensure the compiler has necessary permissions on modern JDKs.

### 2. Room & Data Layer Fixes
- **SQL Fix**: Corrected a join query in [Daos.kt](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/data/local/daos/Daos.kt) that was using an incorrect table name (`category` vs `categories`).
- **Missing Imports**: Added missing imports for `Context`, `BudgetPeriod`, and other models in [AppDatabase.kt](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/data/local/AppDatabase.kt) and [Converters.kt](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/data/db/converters/Converters.kt).

### 3. Worker & Repository Fixes
- **Hilt Workers**: Migrated `SyncWorker` and `SaveParsedMessageWorker` to use `@HiltWorker` for proper dependency injection.
- **Mapping**: Added missing mapping logic to [Extensions.kt](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/data/model/Extensions.kt) to support converting domain models to Room entities.
- **Hilt Binding**: Added `@ApplicationContext` to `ApiRepository` to fix a dependency injection error.

### 4. UI & ViewModel Cleanup
- **Syntax Correction**: Fixed an invalid `private var set` declaration in [DashboardViewModel.kt](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/ui/screens/dashboard/DashboardViewModel.kt) and [LoginViewModel.kt](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/ui/screens/login/LoginViewModel.kt).
- **Import Cleanup**: Removed duplicate and conflicting imports in [MainActivity.kt](file:///D:/Projects/expense-tracker/android-app/app/src/main/java/com/expensetracker/app/ui/MainActivity.kt) and added missing Compose annotations.

## Verification Results

### Build Status
> [!NOTE]
> The project now builds successfully using `./gradlew assembleDebug`.

### Tests Run
- Verified KSP code generation for Room and Hilt.
- Verified that all compilation errors across 10+ files were resolved.
