import struct
import zlib

def make_png(width, height, r, g, b, path):
    sig = b'\x89PNG\r\n\x1a\n'
    ihdr_data = struct.pack('>IIBBEEE', width, height, 8, 2, 0, 0, 0)
    ihdr = struct.pack('>I', 13) + b'IHDR' + ihdr_data + struct.pack('>I', zlib.crc32(b'IHDR' + ihdr_data))
    
    raw = bytearray()
    for y in range(height):
        raw.append(0)
        for x in range(width):
            raw.extend([r, g, b])
            
    comp = zlib.compress(raw)
    idat = struct.pack('>I', len(comp)) + b'IDAT' + comp + struct.pack('>I', zlib.crc32(b'IDAT' + comp))
    iend = struct.pack('>I', 0) + b'IEND' + struct.pack('>I', zlib.crc32(b'IEND'))
    
    with open(path, 'wb') as f:
        f.write(sig + ihdr + idat + iend)

make_png(192, 192, 61, 225, 176, r"d:\Projects\expense-tracker\frontend\public\icon-192.png")
make_png(512, 512, 61, 225, 176, r"d:\Projects\expense-tracker\frontend\public\icon-512.png")
print("Successfully generated icon-192.png and icon-512.png")
