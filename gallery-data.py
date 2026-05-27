"""
Generate a lightweight JSON manifest of generated images.
Extracts prompt and timestamp from metadata files to avoid embedding large base64 data.
"""

import json
import os
from pathlib import Path


def generate_gallery_data():
    """Scan images and metadata directories, create gallery-data.json manifest."""

    images_dir = Path("public/images")
    metadata_dir = Path("generated_images")

    if not images_dir.exists():
        print(f"Error: {images_dir} directory not found")
        return

    # Get all image files (prefer WebP, fallback to JPG)
    # Collect all WebP files
    webp_files = {f.stem: "webp" for f in images_dir.glob("*.webp")}
    # Collect all JPG files
    jpg_files = {f.stem: "jpg" for f in images_dir.glob("*.jpg")}

    # Merge: prefer WebP if it exists, otherwise use JPG
    image_stems = set(webp_files.keys()) | set(jpg_files.keys())
    image_files = sorted(image_stems)

    if not image_files:
        print("No images found in images/ directory")
        return

    gallery_data = []

    for image_name in image_files:
        # Determine image format (prefer WebP)
        if image_name in webp_files:
            image_ext = "webp"
        else:
            image_ext = "jpg"

        image_path = f"/images/{image_name}.{image_ext}"
        metadata_path = metadata_dir / f"{image_name}_metadata.json"

        # Extract prompt and timestamp from metadata
        prompt = "Unknown prompt"
        timestamp = ""

        if metadata_path.exists():
            try:
                with open(metadata_path, "r") as f:
                    metadata = json.load(f)
                    # Extract prompt (stored at top level)
                    prompt = metadata.get("prompt", "Unknown prompt")
                    # Extract timestamp
                    timestamp = metadata.get("timestamp", "")
            except Exception as e:
                print(f"Warning: Could not parse metadata for {image_name}: {e}")

        gallery_data.append({
            "id": image_name,
            "image": image_path,
            "prompt": prompt,
            "timestamp": timestamp
        })

    # Write manifest
    output_path = Path("public/gallery-data.json")
    with open(output_path, "w") as f:
        json.dump(gallery_data, f, indent=2)

    print(f"Generated gallery-data.json with {len(gallery_data)} images")


if __name__ == "__main__":
    generate_gallery_data()
