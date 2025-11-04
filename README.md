# Waifu Image Generator

A Python script for generating images using OpenRouter's API with Google's Nano Banana model.

## Features

- Generate images using OpenRouter API
- Budget tracking with configurable spending limits
- Rate limiting to prevent API overuse
- Batch image generation support
- Persistent statistics tracking

## Setup

### 1. Create Virtual Environment

```bash
python -m venv .venv
```

### 2. Activate Virtual Environment

**Windows:**
```bash
.venv\Scripts\activate
```

**macOS/Linux:**
```bash
source .venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   copy .env.example .env
   ```

2. Edit `.env` and add your OpenRouter API key:
   ```
   OPENROUTER_API_KEY=your_actual_api_key_here
   ```

   Get your API key from: https://openrouter.ai/keys

### 5. Create Prompts File (Optional)

If using `main.py`, create a `prompts.json` file with your image prompts:

```json
[
  "a beautiful anime character with blue hair",
  "a cyberpunk city at night",
  "a fantasy landscape with mountains"
]
```

## Usage

### Using the Image Generator Module

```python
from generate_images_openrouter import OpenRouterImageGenerator
import os

# Initialize generator
api_key = os.getenv('OPENROUTER_API_KEY')
generator = OpenRouterImageGenerator(api_key)

# Generate a single image
result = generator.generate_image(
    prompt="a beautiful anime character",
    output_filename="image.png"
)

if result['success']:
    print(f"Image saved to: {result['filename']}")
    print(f"Cost: ${result['cost']:.4f}")
```

### Using the Main Script

```bash
python main.py
```

This will read prompts from `prompts.json` and generate images for each prompt.

## Running the Gallery

After generating images, you can view them in a web browser using the built-in local server:

### Quick Start (Windows)
Simply double-click `serve.bat` and open http://localhost:3000 in your browser.

### Manual Start
```bash
python -m http.server 3000
```

Then visit: **http://localhost:3000**

### Gallery Features
- **Responsive Grid Layout** - Automatically adapts from desktop (4 columns) to mobile (2 columns)
- **Lazy Loading** - Images load only when they come into view for better performance
- **Lightbox Viewer** - Click any image to view it full-screen with metadata
- **Keyboard Navigation**:
  - `ESC` - Close lightbox
  - `←/→` Arrow keys - Navigate between images in lightbox
- **Image Metadata** - View the original prompt and generation timestamp for each image

### Gallery Files
- `index.html` - Gallery page structure
- `style.css` - Responsive styling and animations
- `app.js` - Interactive functionality (lazy loading, lightbox, navigation)
- `gallery-data.json` - Auto-generated manifest of all images

## Budget Management

The image generator includes built-in budget tracking:
- Default budget limit: $5 USD
- Spending tracked in `generation_stats.json`
- Automatic budget enforcement

## Project Structure

```
waifu/
├── .venv/                          # Virtual environment (not in git)
├── generate_images_openrouter.py  # Main image generator module
├── main.py                         # Example usage script
├── requirements.txt                # Python dependencies
├── .env                            # Environment variables (not in git)
├── .env.example                    # Environment template
├── .gitignore                      # Git ignore rules
├── prompts.json                    # Image prompts (not in git)
├── generation_stats.json           # Usage statistics (not in git)
└── README.md                       # This file
```

## API Information

This project uses OpenRouter's API with the Google Nano Banana model for image generation. For more information about pricing and usage, visit: https://openrouter.ai/

## Notes

- Generated images are saved in the project directory
- Images are excluded from git via `.gitignore`
- Rate limiting is set to 1 second minimum between requests
- All costs and usage are tracked in `generation_stats.json`
