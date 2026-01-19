# Speed Reader

A browser extension for speed reading using RSVP (Rapid Serial Visual Presentation). Words are displayed one at a time (or in smart chunks) at a configurable speed.

## Features

- **Adjustable speed**: 100-800 WPM
- **Smart chunking**: Groups words into natural phrases (e.g., "in the morning", "the quick")
- **Single-word mode**: Toggle chunking off for classic RSVP
- **Auto-detect content**: Automatically finds article content if no text is selected
- **Persistent settings**: Your speed and chunking preferences are saved

## Installation

### Firefox / Zen Browser

1. Go to `about:debugging`
2. Click **"This Firefox"**
3. Click **"Load Temporary Add-on"**
4. Select `manifest.json` from this folder

Note: Temporary add-ons are removed when the browser closes. Reload on each session.

### Chrome

1. Go to `chrome://extensions`
2. Enable **"Developer mode"** (top right)
3. Click **"Load unpacked"**
4. Select this folder

## Usage

1. Navigate to any webpage with text
2. **Select the text** you want to read (or leave empty to auto-detect article content)
3. Click the extension icon in the toolbar
4. Adjust speed with the slider
5. Click **Start**

## Keyboard shortcuts

- Click **Pause** to pause/resume
- Click **Reset** to start over with new text

## License

MIT
