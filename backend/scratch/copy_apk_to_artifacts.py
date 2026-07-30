import shutil
import os

src = r"d:\Projects\expense-tracker\android-app\app\build\outputs\apk\debug\app-debug.apk"
dst = r"C:\Users\indev\.gemini\antigravity-ide\brain\f93a761e-9c4e-4b74-99c4-7a7e6906005d\expense-tracker-v1.0-debug.apk"

shutil.copy2(src, dst)
print("Copied APK to artifact directory:", dst)
