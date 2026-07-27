# Fix Gradle Sync Error: Could Not Resolve Dependencies (Offline Mode)

The project is failing to sync because Gradle is running in **Offline Mode**, and the required dependencies (AGP 8.2.2, Kotlin 1.9.10, Hilt 2.48) are not present in the local cache.

## User Review Required

> [!IMPORTANT]
> The primary fix requires interaction with the Android Studio UI to disable **Offline Mode**.

- You need to toggle off "Offline Mode" in the Gradle tool window in Android Studio.
- The project is also missing the Gradle wrapper files (`gradlew`, `gradlew.bat`), which should be restored for better stability and CI/CD support.

## Proposed Changes

### 1. Configure Gradle Properties
I will create a `gradle.properties` file to explicitly ensure offline mode is disabled and to optimize the build environment.

#### [NEW] [gradle.properties](file:///D:/Projects/expense-tracker/android-app/gradle.properties)
- Set `org.gradle.offline=false`.
- Add common performance tweaks.

### 2. Modernize Repository Configuration
Moving repository definitions to `settings.gradle.kts` using `dependencyResolutionManagement` is the modern standard and can sometimes resolve issues where `allprojects` is ignored or overridden.

#### [MODIFY] [settings.gradle.kts](file:///D:/Projects/expense-tracker/android-app/settings.gradle.kts)
- Add `pluginManagement` and `dependencyResolutionManagement`.

#### [MODIFY] [build.gradle](file:///D:/Projects/expense-tracker/android-app/build.gradle)
- Remove `allprojects` repository block as it will be handled by `settings.gradle.kts`.

## Verification Plan

### Manual Verification
1. **Disable Offline Mode in AS**:
   - Open the **Gradle** tool window (usually on the right side).
   - Look for the **Toggle Offline Mode** icon (a cloud with a red slash or a similar icon).
   - Click it to disable offline mode.
2. **Sync Project**:
   - Click "Sync Project with Gradle Files" (elephant icon).
3. **Verify Build**:
   - Run `./gradlew help` (after restoring the wrapper) or use the IDE to build.
