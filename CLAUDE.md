# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Waifu Image Generator** - A Python application that generates images using OpenRouter's API (Google Gemini 2.5 Flash Image Preview model). The tool includes budget tracking, rate limiting, and automatic JPG image export.

## Architecture

### Core Components

1. **`generate_images_openrouter.py`** - Main module containing the `OpenRouterImageGenerator` class
   - Handles API communication with OpenRouter
   - Manages budget tracking via `generation_stats.json`
   - Implements rate limiting (1 second minimum between requests)
   - Converts base64 image responses to JPG files
   - Saves metadata for each generated image

2. **`main.py`** - Entry point script
   - Loads API key from `.env` file using `python-dotenv`
   - Reads prompts from `prompts.json` (format: `{"prompts": [...]}`)
   - Initiates batch generation with specified budget

### Key Features

- **Budget Enforcement**: Tracks spending across sessions via `generation_stats.json`. Default budget is $5 USD
- **Persistent State**: Loads previous spending stats on startup to prevent budget overruns
- **Image Export**: Automatically converts API response (base64 PNG) to JPG with 95% quality
- **Batch Processing**: Processes multiple prompts sequentially with rate limiting between requests

## Setup & Commands

### Initial Setup
```bash
# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Configuration
1. Copy `.env.example` to `.env`
2. Add your OpenRouter API key to `.env`: `OPENROUTER_API_KEY=your_key`
3. Create `prompts.json` with format: `{"prompts": ["prompt 1", "prompt 2", ...]}`

### Running
```bash
python main.py
```

## Important Implementation Details

### Budget Handling
- **Current Behavior**: Loads previous spending from `generation_stats.json` on each run. If you refill credits, you must delete the stats file to reset spending tracking.
- **Spending Rate**: Currently estimated at $0.15 per image (actual rate may vary based on OpenRouter pricing)
- **Budget Check**: Stops batch generation when remaining budget < 50% of estimated cost per image

### Image Storage
- Generated JPG files are saved to `public/images/` directory (served by Vite)
- Metadata (API responses) are saved to `generated_images/` directory
- Both directories are created automatically if they don't exist

### API Integration
- Endpoint: `https://openrouter.ai/api/v1/chat/completions`
- Model: `google/gemini-2.5-flash-image-preview`
- Request format uses OpenAI-compatible chat completions with `modalities: ["image", "text"]` parameter
- Images returned as base64-encoded data URLs in response

### Dependencies
- `requests` - HTTP API calls
- `python-dotenv` - Environment variable loading
- `Pillow` - Image processing (base64 → JPG conversion)

## Common Tasks

### Generate images
```bash
python main.py
```

### Reset budget tracking
Delete `generation_stats.json` before running to reset spending history (useful after refilling credits)

### Modify budget
Edit `main.py` line 18: `budget_usd=5.0` parameter in `OpenRouterImageGenerator()`

### Change estimated cost
Edit `generate_images_openrouter.py` line 46: `self.estimated_cost_per_image = 0.15`

## Frontend Gallery

A vanilla HTML/CSS/JS single-page app displays generated images with full interactivity. Built with **Vite** for optimized development and production builds.

### Gallery Features ✅ (Implemented)
- Responsive CSS Grid layout (4 cols desktop, 3 cols tablet, 2 cols mobile)
- Lazy loading with Intersection Observer API (images load only within 200px of viewport)
- Lightbox modal viewer with metadata display (glassmorphism design)
- Keyboard navigation (ESC to close, arrow keys to navigate between images)
- Image metadata extraction from `generated_images/` JSON files (prompt, timestamp)
- Modern build tool: Vite for HMR, code splitting, and optimized production builds

### Gallery Components
1. **`gallery-data.py`** - Python script that scans public/images/ and generated_images/ directories
   - Generates `public/gallery-data.json` manifest with prompt and timestamp for each image
   - Excludes large base64 data to keep payload lightweight
   - Fetched dynamically by the gallery app (no rebuild needed when updated)

2. **`index.html`** - Main gallery entry point (Vite root)
   - Semantic HTML with grid container and lightbox modal
   - Image cards with lazy-loading attributes
   - Loads module script from `/src/main.js`

3. **`src/style.css`** - Responsive grid and lightbox styles
   - CSS Grid with auto-fill and minmax for fluid responsiveness
   - Glassmorphism effects with backdrop blur
   - Smooth animations and hover effects
   - Fully responsive from 480px to 1400px+
   - Dark gradient background: black (#0a0a0a) → dark purple (#1a0033) → purple (#330066)
   - Fancy title font: Playfair Display serif with purple gradient text effect and glow shadow

4. **`src/main.js`** - Core interactive functionality
   - Imports `style.css` for styling
   - Fetches `gallery-data.json` from public folder at runtime
   - Intersection Observer for lazy image loading
   - Dynamic grid population from fetched gallery data
   - Lightbox modal with full-screen viewer
   - Keyboard navigation (ESC, arrow keys)
   - Error handling for missing images/metadata

5. **`public/images/`** - Generated images directory
   - Contains JPG and WebP image files generated by `generate_images_openrouter.py`
   - Served directly by Vite dev server and build output
   - Gitignored (not tracked in version control)

### Running the Gallery

#### Quick Start (Windows)
```bash
# Install dependencies first (one time only)
npm install

# Double-click serve.bat (or run: npm run dev)
```

#### Manual Start
```bash
npm run dev
```

Visit: **http://localhost:5173**

#### Build for Production
```bash
npm run build
```

Builds to `dist/` directory with optimized assets.

#### Gallery Files
- `index.html` - Gallery structure and Vite entry point
- `src/main.js` - Main entry point (imports CSS, fetches gallery data)
- `src/style.css` - Styling and animations
- `public/gallery-data.json` - Auto-generated image manifest (generated by gallery-data.py)
- `public/images/` - Generated images directory (JPG/WebP)
- `serve.bat` - Windows batch script to start dev server on port 5173
- `vite.config.js` - Vite configuration
- `package.json` - Node.js dependencies and scripts

## Performance Optimizations ✅

- **Lazy loading verified**: Intersection Observer API loads images only within 200px of viewport
- **Lightweight manifest**: `gallery-data.py` extracts only `prompt` and `timestamp` from metadata, excluding all base64 data
- **Dynamic data loading**: `gallery-data.json` is fetched at runtime from public folder (no rebuild needed for updates)
- **Fast initial load**: `gallery-data.json` contains only image paths and text, keeping payload minimal
- **Memory efficient**: Images unobserved after loading to prevent memory leaks
- **Vite optimizations**: Automatic minification, code splitting, and tree-shaking for production builds
- **HMR enabled**: Hot Module Replacement for instant CSS/JS updates during development
- **Image optimization**: WebP format support with JPG fallback for better compression

## WebP Conversion

The project includes a WebP conversion utility for optimizing gallery images.

### `convert_to_webp.py` - Image format converter
- Converts JPG images to WebP format using Pillow library
- Cross-platform solution (no external dependencies required)
- Configurable quality setting (default: 80)
- Skips existing WebP files by default to avoid redundant conversion
- Provides detailed conversion statistics

### Usage
```bash
# Convert with default settings (quality=80, skip existing)
python convert_to_webp.py

# Force regenerate all WebP files
python convert_to_webp.py --force
python convert_to_webp.py -f

# Custom quality setting
python convert_to_webp.py --quality 90
python convert_to_webp.py -q 90

# Combine flags
python convert_to_webp.py -q 95 -f
```

### Command-line Arguments
- `-q, --quality`: WebP quality setting (0-100, default: 80)
- `-f, --force`: Force regeneration of WebP files even if they already exist

## Notes for Future Development

- The code assumes `prompts.json` has structure `{"prompts": [list of strings]}` - validate format on load
- Image conversion from PNG to RGB happens automatically (loses alpha channel, replaces with white background)
- `.gitignore` excludes generated images, stats, and `.env` file - remember when committing changes
- Consider adding: input validation, search/filter, sorting options, image download functionality
