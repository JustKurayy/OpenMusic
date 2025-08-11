# OpenMusic

<!-- [![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE) -->
[![Version](https://img.shields.io/github/package-json/v/JustKurayy/OpenMusic?color=blue)](package.json)
[![Stars](https://img.shields.io/github/stars/JustKurayy/OpenMusic?style=social)](https://github.com/JustKurayy/OpenMusic/stargazers)

A self-hosted alternative to SoundCloud or Spotify — privately host and stream your music, just like you would movies on Plex or Jellyfin.

---

## What is OpenMusic?

OpenMusic empowers you to **self-host** your personal music library in a sleek, web-based interface.  
Upload, stream, and manage your own music collection with **full privacy** and **no reliance on third-party services**.

---

## !Warning!

This application is mostly vibe-coded with copilot & claude (for frontend). Needs a lot of fixing to be used properly.

---

## ✨ Features

- **🔒 Secure Access**  
  - Google OAuth2 authentication via Passport.js with JWT sessions  
  - Optional “Guest Mode” for casual listening

- **📂 Private Libraries**  
  - Organize music by user  
  - MP3/WAV uploads with automatic metadata extraction

- **🎵 Audio Streaming**  
  - Stream directly via HTML5 Audio API  
  - Full playback controls, queue management, and progress tracking

- **📜 Playlist Management**  
  - Create, edit, delete playlists  
  - Add/remove tracks and reorder them

- **🎨 Spotify-Inspired UI**  
  - Dark theme, green accent highlights  
  - Fully responsive design

---

## 📦 Installation

To run your own instance of OpenMusic:

```bash
# 1. Clone the repository
git clone https://github.com/JustKurayy/OpenMusic.git
cd OpenMusic

# 2. Copy the example env and configure
cp .env.example .env
# Fill in DATABASE_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
# JWT_SECRET, and SESSION_SECRET

# 3. Install dependencies
npm install

# 4. Initialize database
npm run db:push

# 5. Start development
npm run dev
```