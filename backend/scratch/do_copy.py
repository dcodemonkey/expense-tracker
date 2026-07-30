import os
import shutil

src = os.path.abspath(r"d:\Projects\expense-tracker\android-app\app\build\outputs\apk\debug\app-debug.apk")
dst = os.path.abspath(r"d:\Projects\expense-tracker\frontend\public\expense-tracker.apk")

print(f"Reading from: {src} (exists: {os.path.exists(src)})")
print(f"Writing to: {dst}")

with open(src, 'rb') as f_in:
    data = f_in.read()

with open(dst, 'wb') as f_out:
    f_out.write(data)

print(f"Successfully copied {len(data)} bytes! Destination exists: {os.path.exists(dst)}")
