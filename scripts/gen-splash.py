"""
Generate a solid orange 2732x2732 PNG splash screen for iOS.
Output path: ios/App/App/Assets.xcassets/Splash.imageset/splash.png
Run from the project root: python3 scripts/gen-splash.py
"""
import struct
import zlib
import os

W, H = 2732, 2732
BG = (255, 107, 0, 255)  # #FF6B00 orange

rows = []
for y in range(H):
    row = bytearray([0])  # filter type: None
    for x in range(W):
        row += bytearray(BG)
    rows.append(bytes(row))

raw = b"".join(rows)
compressed = zlib.compress(raw, 1)


def chunk(tag, data):
    c = tag + data
    return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)


png = (
    b"\x89PNG\r\n\x1a\n"
    + chunk(b"IHDR", struct.pack(">IIBBBBB", W, H, 8, 2, 0, 0, 0))
    + chunk(b"IDAT", compressed)
    + chunk(b"IEND", b"")
)

out_path = "ios/App/App/Assets.xcassets/Splash.imageset/splash.png"
os.makedirs(os.path.dirname(out_path), exist_ok=True)
with open(out_path, "wb") as f:
    f.write(png)

print(f"Splash PNG written: {len(png)} bytes → {out_path}")
