import os
import shutil

src = r"d:\Projects\expense-tracker\backend\app"
dst = r"d:\Projects\expense-tracker\frontend\api\app"

if os.path.exists(dst):
    shutil.rmtree(dst)

shutil.copytree(src, dst)
print("Synced backend/app -> frontend/api/app")
