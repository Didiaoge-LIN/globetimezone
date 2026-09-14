"""Convert PNG icons to WebP format for GlobeTimeZone performance optimization."""
from pathlib import Path
from PIL import Image
import sys

ICONS_DIR = Path(__file__).parent / "icons"
ROOT_DIR = Path(__file__).parent

# Files to convert
files_to_convert = [
    # PWA icons
    ICONS_DIR / "icon-72x72.png",
    ICONS_DIR / "icon-96x96.png",
    ICONS_DIR / "icon-128x128.png",
    ICONS_DIR / "icon-144x144.png",
    ICONS_DIR / "icon-152x152.png",
    ICONS_DIR / "icon-192x192.png",
    # Apple touch icon
    ROOT_DIR / "apple-touch-icon.png",
]

converted = 0
total_saved = 0

for png_path in files_to_convert:
    if not png_path.exists():
        print(f"  SKIP: {png_path.name} (not found)")
        continue

    webp_path = png_path.with_suffix(".webp")

    try:
        img = Image.open(png_path)

        # Convert to RGB if RGBA (WebP supports both, but we optimize)
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGBA")

        # Save as WebP with quality 80 (good balance)
        img.save(webp_path, "WEBP", quality=80, method=6)

        # Calculate savings
        png_size = png_path.stat().st_size
        webp_size = webp_path.stat().st_size
        saved = png_size - webp_size
        total_saved += saved
        pct = (saved / png_size * 100) if png_size > 0 else 0

        print(f"  OK: {png_path.name} -> {webp_path.name}  "
              f"({png_size}B -> {webp_size}B, -{pct:.0f}%)")
        converted += 1

    except Exception as e:
        print(f"  FAIL: {png_path.name}: {e}")

print(f"\n  Converted: {converted} files, Total saved: {total_saved}B ({total_saved/1024:.1f}KB)")
