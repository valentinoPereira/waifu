# AGENTS.md - Waifu Image Generator

> Agent instructions for working on this project. See CLAUDE.md for detailed human-oriented documentation.

## Project Overview

**Waifu Image Generator** is a Python application that generates images via OpenRouter's API (Google Gemini 2.5 Flash Image model) and displays them in a modern Vite-powered web gallery.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3, requests, Pillow, python-dotenv |
| Frontend | Vite, Vanilla HTML/CSS/JS |
| API | OpenRouter (google/gemini-2.5-flash-image-preview) |

---

## File Structure

### Core Python Modules
```
├── generate_images_openrouter.py  # Main image generator class
├── main.py                        # Entry point for batch generation
├── gallery-data.py                # Generates gallery-data.json manifest
├── convert_to_webp.py             # Converts JPG → WebP
├── prompts.json                   # Image prompts input
├── requirements.txt               # Python dependencies
└── generation_stats.json          # Budget tracking (auto-generated)
```

### Frontend (Gallery)
```
├── index.html                    # Vite entry point
├── src/
│   ├── main.js                  # Gallery logic (lazy loading, lightbox)
│   └── style.css                # Responsive styles
├── public/
│   ├── gallery-data.json         # Image manifest (generated)
│   └── images/                   # Generated images directory
├── vite.config.js               # Vite configuration
└── package.json                  # Node dependencies
```

### Configuration
```
├── .env                         # API key (not in git)
├── .env.example                 # Environment template
└── .gitignore                   # Excludes generated files
```

---

## Available Commands

### Python Commands

```bash
# Setup virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (macOS/Linux)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Generate images (reads prompts.json)
python main.py

# Generate gallery manifest
python gallery-data.py

# Convert images to WebP
python convert_to_webp.py                    # Default (quality=80)
python convert_to_webp.py -q 90              # Custom quality
python convert_to_webp.py -f                 # Force regenerate all

# Reset budget tracking (delete stats file)
del generation_stats.json
```

### NPM Commands

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build
```

---

## Setup Instructions

### 1. Python Environment
```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### 2. API Configuration
```bash
copy .env.example .env
```
Edit `.env` and add:
```
OPENROUTER_API_KEY=your_api_key_here
```
Get API key from: https://openrouter.ai/keys

### 3. Create Prompts
Create `prompts.json`:
```json
{
  "prompts": [
    "a beautiful anime character with blue hair",
    "a cyberpunk city at night"
  ]
}
```

### 4. Generate Images
```bash
python main.py
```

### 5. Run Gallery
```bash
npm install
npm run dev
```
Open: http://localhost:5173

---

## Configuration

### Budget Settings

| File | Parameter | Default |
|------|-----------|---------|
| `main.py` line 18 | `budget_usd` | 5.0 |
| `generate_images_openrouter.py` line 46 | `estimated_cost_per_image` | 0.15 |

To reset budget tracking: delete `generation_stats.json`

### Gallery Data Format

`prompts.json`:
```json
{
  "prompts": ["prompt 1", "prompt 2"]
}
```

`gallery-data.json` (generated):
```json
[
  { "filename": "image.jpg", "prompt": "...", "timestamp": "..." }
]
```

---

## Common Agent Tasks

### Generate New Images
```bash
# 1. Update prompts.json with new prompts
# 2. Reset budget if needed (del generation_stats.json)
# 3. Run generator
python main.py
```

### Update Gallery
```bash
# Regenerate manifest after adding images
python gallery-data.py

# Convert to WebP for optimization
python convert_to_webp.py
```

### Modify Budget
- Edit `main.py`: `budget_usd=5.0` (line 18)
- Or edit `generate_images_openrouter.py`: `self.estimated_cost_per_image = 0.15` (line 46)

### Frontend Development
```bash
# Start dev server with hot reload
npm run dev

# Build for production
npm run build
```

---

## Development Notes

### API Integration
- **Endpoint**: `https://openrouter.ai/api/v1/chat/completions`
- **Model**: `google/gemini-2.5-flash-image-preview`
- **Rate limit**: 1 second between requests
- **Image format**: Base64 PNG → converted to JPG (95% quality)

### Image Storage
- Generated images → `public/images/`
- Metadata (JSON) → `generated_images/`
- Both directories are gitignored

### Gallery Features
- Lazy loading via Intersection Observer (200px threshold)
- Lightbox with keyboard nav (ESC close, arrows navigate)
- Responsive: 4 cols (desktop) → 2 cols (mobile)
- Dark gradient background with glassmorphism effects

---

## Important Constraints

- `prompts.json` must have format: `{"prompts": [list]}`
- Generated images use JPG format (PNG alpha → white background)
- Budget is persistent across sessions via `generation_stats.json`
- Delete stats file to reset budget after refilling credits
- `.env` contains API key - never commit to git

---

## GitHub Repository

https://github.com/valentinoPereira/waifu
