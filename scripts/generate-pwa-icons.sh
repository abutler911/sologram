#!/bin/bash

# This script helps generate PWA icons from a source icon
# Usage: ./scripts/generate-pwa-icons.sh source_image.png

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "Error: ImageMagick is required but not installed."
    echo "Please install it with:"
    echo "  - macOS: brew install imagemagick"
    echo "  - Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "  - Windows: Download from https://imagemagick.org/script/download.php"
    exit 1
fi

# Check for source image
SOURCE_IMAGE=$1

if [ -z "$SOURCE_IMAGE" ]; then
    echo "Error: No source image provided."
    echo "Usage: $0 source_image.png"
    exit 1
fi

if [ ! -f "$SOURCE_IMAGE" ]; then
    echo "Error: Source image '$SOURCE_IMAGE' not found."
    exit 1
fi

echo "Generating PWA icons from $SOURCE_IMAGE..."

# Create public directory if it doesn't exist
mkdir -p public

# Generate standard icons
convert "$SOURCE_IMAGE" -resize 16x16 public/favicon-16x16.png
convert "$SOURCE_IMAGE" -resize 32x32 public/favicon-32x32.png
convert "$SOURCE_IMAGE" -resize 48x48 public/favicon-48x48.png
convert "$SOURCE_IMAGE" -resize 192x192 public/logo192.png
convert "$SOURCE_IMAGE" -resize 512x512 public/logo512.png

# Generate favicon.ico (multi-size icon)
convert public/favicon-16x16.png public/favicon-32x32.png public/favicon-48x48.png public/favicon.ico

# Generate Apple touch icon
convert "$SOURCE_IMAGE" -resize 180x180 public/apple-touch-icon.png

# Generate maskable icon (with padding for safe area)
convert "$SOURCE_IMAGE" -resize 192x192 -gravity center -background none \
        -extent 236x236 public/maskable_icon.png

echo "PWA icons generated successfully!"
echo "Generated files:"
echo "  - public/favicon.ico"
echo "  - public/favicon-16x16.png"
echo "  - public/favicon-32x32.png"
echo "  - public/favicon-48x48.png"
echo "  - public/logo192.png"
echo "  - public/logo512.png"
echo "  - public/apple-touch-icon.png"
echo "  - public/maskable_icon.png"