# SoloGram PWA Features

This document explains the Progressive Web App (PWA) features that have been implemented in the SoloGram application.

## What is a PWA?

A Progressive Web App (PWA) is a web application that uses modern web capabilities to deliver an app-like experience to users. PWAs are:

- **Reliable** - Load instantly and never show the "dinosaur" offline page, even in uncertain network conditions
- **Fast** - Respond quickly to user interactions with smooth animations and no janky scrolling
- **Engaging** - Feel like a natural app on the device, with immersive user experience

## PWA Features in SoloGram

### 1. Offline Support

SoloGram now works offline and in low-quality network conditions:

- **Cached Resources**: Core app assets (HTML, CSS, JS) are cached for offline use
- **Offline Page**: A custom offline page is shown when there's no connectivity and the requested page isn't cached
- **Offline Indicator**: A notification bar appears when you're offline
- **Media Caching**: Previously viewed images and videos are cached for offline viewing

### 2. Installability

SoloGram can be installed on your device:

- **Install Prompt**: A custom prompt shows when the app can be installed
- **Home Screen Icon**: Proper icons for various device sizes
- **Splash Screen**: Custom splash screen when launching from home screen
- **Standalone Mode**: Opens in standalone mode (without browser UI) when installed

### 3. Performance Enhancements

- **Optimized Loading**: Service worker provides faster loading after first visit
- **Caching Strategies**: Different caching strategies for different types of content
- **Background Updates**: Resources update in the background without disrupting the user

### 4. App-like Experience

- **Full-Screen Mode**: No browser UI when launched from home screen
- **Responsive Design**: Works on all screen sizes
- **Themed Experience**: Consistent theme color throughout the experience

## How to Install SoloGram as a PWA

### On Android (Chrome):

1. Visit SoloGram in Chrome
2. Tap the menu button (three dots)
3. Select "Add to Home screen"
4. Follow the prompts to install

### On iOS (Safari):

1. Visit SoloGram in Safari
2. Tap the Share button
3. Scroll down and select "Add to Home Screen"
4. Tap "Add" to confirm

### On Desktop (Chrome, Edge, or other Chromium browsers):

1. Visit SoloGram
2. Look for the install icon in the address bar (or three dots menu)
3. Click "Install SoloGram"
4. Follow the prompts to install

## Using SoloGram Offline

Once installed:

1. You can browse previously visited pages even without an internet connection
2. New content will be available when you reconnect
3. Cached media content will be available offline
4. Actions performed while offline (like likes or comments) will sync when you reconnect

## Feedback

If you encounter any issues with the PWA functionality, please report them by contacting the site administrator.
