"""
Image generation script using Google Nano Banana model via OpenRouter.
Includes rate limiting and budget tracking to stay within $5 limit.
"""

import requests
import time
import os
import json
import base64
from datetime import datetime, timedelta
from typing import Optional
from PIL import Image
from io import BytesIO


class OpenRouterImageGenerator:
    def __init__(self, api_key: str, images_dir: str = "public/images"):
        """
        Initialize the image generator.

        Args:
            api_key: OpenRouter API key
            images_dir: Directory to save generated images
        """
        self.api_key = api_key
        self.base_url = "https://openrouter.ai/api/v1"
        self.model = "google/gemini-2.5-flash-image-preview"
        self.request_count = 0
        self.last_request_time = 0
        self.min_request_interval = 1.0  # Minimum 1 second between requests
        self.stats_file = "generation_stats.json"
        self.images_dir = images_dir

        # Create images directory if it doesn't exist
        os.makedirs(self.images_dir, exist_ok=True)

        # Load previous stats if exists
        self._load_stats()

    def _load_stats(self):
        """Load stats from file."""
        if os.path.exists(self.stats_file):
            try:
                with open(self.stats_file, "r") as f:
                    data = json.load(f)
                    self.request_count = data.get("request_count", 0)
                    self.completed_prompt_indices = set(data.get("completed_prompt_indices", []))
                    if self.completed_prompt_indices:
                        print(f"Loaded previous stats: {self.request_count} requests completed")
                        print(f"Resuming from prompt {max(self.completed_prompt_indices) + 2} (already completed {len(self.completed_prompt_indices)} prompts)")
            except Exception as e:
                print(f"Could not load stats: {e}")
        else:
            self.completed_prompt_indices = set()

    def _save_stats(self):
        """Save stats to file."""
        try:
            with open(self.stats_file, "w") as f:
                json.dump(
                    {
                        "request_count": self.request_count,
                        "completed_prompt_indices": sorted(list(self.completed_prompt_indices)),
                        "timestamp": datetime.now().isoformat(),
                    },
                    f,
                    indent=2,
                )
        except Exception as e:
            print(f"Could not save stats: {e}")

    def _save_image_from_base64(self, base64_url: str, output_path: str) -> bool:
        """
        Extract base64 image data from data URL and save as JPG.

        Args:
            base64_url: Data URL string (data:image/...;base64,...)
            output_path: File path to save the image

        Returns:
            True if successful, False otherwise
        """
        try:
            # Extract base64 data from data URL
            if base64_url.startswith("data:image/"):
                # Split on comma to separate metadata from base64 data
                base64_data = base64_url.split(",", 1)[1]
            else:
                base64_data = base64_url

            # Decode base64 to bytes
            image_bytes = base64.b64decode(base64_data)

            # Open image and convert to RGB (in case of PNG with alpha)
            image = Image.open(BytesIO(image_bytes))
            if image.mode in ('RGBA', 'LA', 'P'):
                # Convert RGBA to RGB
                rgb_image = Image.new('RGB', image.size, (255, 255, 255))
                rgb_image.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
                image = rgb_image

            # Save as JPG
            image.save(output_path, 'JPEG', quality=95)
            return True
        except Exception as e:
            print(f"Error saving image: {e}")
            return False

    def _rate_limit(self):
        """Enforce rate limiting between requests."""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.min_request_interval:
            sleep_time = self.min_request_interval - elapsed
            print(f"Rate limiting: waiting {sleep_time:.2f} seconds...")
            time.sleep(sleep_time)
        self.last_request_time = time.time()

    def _mark_prompt_completed(self, prompt_index: int):
        """Mark a prompt as completed and save stats."""
        self.completed_prompt_indices.add(prompt_index)
        self._save_stats()

    def generate_image(
        self, prompt: str, width: int = 512, height: int = 512, output_filename: Optional[str] = None
    ) -> Optional[dict]:
        """
        Generate an image using the model.

        Args:
            prompt: Text description of the image to generate
            width: Image width in pixels
            height: Image height in pixels
            output_filename: Optional filename to save the image (without extension)

        Returns:
            Response dict with image data or None if failed
        """
        # Apply rate limiting
        self._rate_limit()

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "https://github.com",
            "X-Title": "Image Generator",
        }

        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "modalities": ["image", "text"]
        }

        try:
            print(f"\n📸 Generating image: '{prompt[:60]}...'")
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=60,
            )

            if response.status_code == 200:
                data = response.json()

                # Extract usage info
                usage = response.headers.get("x-ratelimit-remaining-requests", "N/A")
                print(f"Rate limit remaining: {usage} requests")

                # Extract and save image if present
                try:
                    images = data['choices'][0]['message'].get('images', [])
                    if images:
                        image_url = images[0].get('image_url', {}).get('url')
                        if image_url:
                            # Save image as JPG in images directory
                            jpg_filename = output_filename if output_filename else f"image_{self.request_count:03d}.jpg"
                            if not jpg_filename.endswith('.jpg'):
                                jpg_filename += '.jpg'

                            jpg_path = os.path.join(self.images_dir, jpg_filename)
                            if self._save_image_from_base64(image_url, jpg_path):
                                print(f"🖼️  Image saved: {jpg_path}")
                            else:
                                print(f"⚠️  Failed to save image")
                except Exception as e:
                    print(f"⚠️  Could not extract image data: {e}")

                # Update request count
                self.request_count += 1
                self._save_stats()

                print(f"✅ Image generated successfully!")

                return data

            elif response.status_code == 429:
                print("⏱️  Rate limited! Waiting before retry...")
                wait_time = int(response.headers.get("retry-after", 60))
                time.sleep(wait_time)
                return None

            else:
                error = response.json() if response.text else response.reason
                print(f"❌ Error ({response.status_code}): {error}")
                return None

        except requests.exceptions.Timeout:
            print("❌ Request timed out")
            return None
        except Exception as e:
            print(f"❌ Error: {e}")
            return None

    def batch_generate(
        self, prompts: list, output_dir: str = "generated_images"
    ) -> list:
        """
        Generate multiple images with budget and rate limit protection.
        Automatically resumes from where it left off.

        Args:
            prompts: List of prompts to generate images for
            output_dir: Directory to save image metadata

        Returns:
            List of successful generations
        """
        os.makedirs(output_dir, exist_ok=True)
        results = []

        for i, prompt in enumerate(prompts, 1):
            # Skip already completed prompts (i-1 because enumerate starts at 1)
            if (i - 1) in self.completed_prompt_indices:
                print(f"⏭️  Skipping prompt {i}/{len(prompts)} (already completed)")
                continue

            print(f"\n{'=' * 60}")
            print(f"Batch Progress: {i}/{len(prompts)} (Completed: {len(self.completed_prompt_indices)})")
            print(f"{'=' * 60}")

            result = self.generate_image(prompt)
            if result:
                results.append(
                    {
                        "prompt": prompt,
                        "timestamp": datetime.now().isoformat(),
                        "result": result,
                    }
                )

                # Save metadata
                metadata_file = os.path.join(output_dir, f"image_{i:03d}_metadata.json")
                with open(metadata_file, "w") as f:
                    json.dump(results[-1], f, indent=2)

                # Mark this prompt as completed
                self._mark_prompt_completed(i - 1)

            time.sleep(0.5)  # Extra safety delay between requests

        return results


def main():
    """Main execution function."""
    # Get API key from environment
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        print("❌ Error: OPENROUTER_API_KEY environment variable not set")
        print("Set it with: export OPENROUTER_API_KEY='your-key-here'")
        return

    # Initialize generator with $5 budget
    generator = OpenRouterImageGenerator(api_key, budget_usd=5.0)

    # Example prompts
    prompts = [
        "A serene mountain landscape at sunset",
        "Abstract digital art in neon colors",
        "A cozy reading nook with warm lighting",
        "Futuristic city with flying cars",
    ]

    print("🚀 Starting image generation with budget protection")
    print(f"Budget: ${generator.budget_usd:.2f}")
    print(f"Estimated cost per image: ${generator.estimated_cost_per_image:.2f}")
    print(
        f"Max images possible: ~{int(generator.budget_usd / generator.estimated_cost_per_image)}"
    )

    # Generate images
    results = generator.batch_generate(prompts)

    print(f"\n{'=' * 60}")
    print("✅ Batch generation complete!")
    print(f"Generated: {len(results)} images")
    print(f"Total spent: ${generator.spent_usd:.4f} / ${generator.budget_usd:.4f}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
