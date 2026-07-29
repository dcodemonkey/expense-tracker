import os
from PIL import Image, ImageDraw

def create_pwa_icon(size, filename):
    img = Image.new("RGBA", (size, size), color=(11, 15, 23, 255))
    draw = ImageDraw.Draw(img)
    
    # Outer Card
    margin = size // 8
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=size // 6,
        fill=(21, 28, 44, 255),
        outline=(61, 225, 176, 255),
        width=max(2, size // 40)
    )
    
    # Inner Wallet Badge
    w_margin = size // 4
    draw.rounded_rectangle(
        [w_margin, w_margin + size // 16, size - w_margin + size // 16, size - w_margin + size // 8],
        radius=size // 10,
        fill=(61, 225, 176, 255)
    )
    
    img.save(filename, "PNG")
    print(f"Created {filename} ({size}x{size})")

out_dir = r"d:\Projects\expense-tracker\frontend\public"
os.makedirs(out_dir, exist_ok=True)
create_pwa_icon(192, os.path.join(out_dir, "icon-192.png"))
create_pwa_icon(512, os.path.join(out_dir, "icon-512.png"))
