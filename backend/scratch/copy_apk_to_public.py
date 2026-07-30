import shutil

src = r"d:\Projects\expense-tracker\android-app\app\build\outputs\apk\debug\app-debug.apk"
dst = r"d:\Projects\expense-tracker\frontend\public\expense-tracker.apk"

shutil.copy2(src, dst)
print("Successfully copied APK to frontend/public/expense-tracker.apk!")
