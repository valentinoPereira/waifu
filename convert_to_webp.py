"""
Batch convert JPG images to WebP format using Pillow library.
Preserves original JPG files while creating optimized WebP versions.
"""

import argparse
from pathlib import Path
from PIL import Image


def convert_to_webp(quality=80, force=False):
    """
    Convert all JPG images in the public/images/ directory to WebP format.

    Args:
        quality: WebP quality setting (0-100, default 80)
        force: If True, regenerate WebP files even if they already exist
    """
    images_dir = Path("public/images")

    if not images_dir.exists():
        print(f"Error: {images_dir} directory not found")
        return

    # Get all JPG files
    jpg_files = sorted(images_dir.glob("*.jpg"))

    if not jpg_files:
        print("No JPG images found in public/images/ directory")
        return

    print(f"Found {len(jpg_files)} JPG images to convert")
    print(f"Using Pillow with quality={quality}")
    if force:
        print("Force mode enabled: regenerating all WebP files\n")
    else:
        print()

    # Conversion stats
    converted = 0
    skipped = 0
    failed = 0

    for jpg_path in jpg_files:
        webp_path = jpg_path.with_suffix(".webp")

        # Skip if WebP already exists (unless force mode is enabled)
        if webp_path.exists() and not force:
            print(f"[SKIP] {jpg_path.name} (WebP already exists)")
            skipped += 1
            continue

        try:
            # Open and convert to WebP
            with Image.open(jpg_path) as img:
                img.save(webp_path, "WEBP", quality=quality)

            print(f"[OK] Converted {jpg_path.name} -> {webp_path.name}")
            converted += 1

        except Exception as e:
            print(f"[FAIL] Failed to convert {jpg_path.name}: {str(e)}")
            failed += 1

    # Summary
    print(f"\n{'='*50}")
    print(f"Conversion Summary:")
    print(f"  Converted: {converted}")
    print(f"  Skipped:   {skipped}")
    print(f"  Failed:    {failed}")
    print(f"  Total:     {len(jpg_files)}")
    print(f"{'='*50}")

    if converted > 0:
        print("\nNext steps:")
        print("   1. Run: python gallery-data.py")
        print("   2. Refresh gallery in browser to see WebP images")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Convert JPG images to WebP format"
    )
    parser.add_argument(
        "-q", "--quality",
        type=int,
        default=80,
        help="WebP quality setting (0-100, default: 80)"
    )
    parser.add_argument(
        "-f", "--force",
        action="store_true",
        help="Force regeneration of WebP files even if they already exist"
    )

    args = parser.parse_args()
    convert_to_webp(quality=args.quality, force=args.force)
