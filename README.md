# OpenMusic

<!-- [![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE) -->
[![Version](https://img.shields.io/github/package-json/v/JustKurayy/OpenMusic?color=blue)](package.json)
[![Stars](https://img.shields.io/github/stars/JustKurayy/OpenMusic?style=social)](https://github.com/JustKurayy/OpenMusic/stargazers)

A self-hosted alternative to SoundCloud or Spotify — privately host and stream your music, just like you would movies on Plex or Jellyfin.

---

## Overview

OpenMusic empowers you to **self-host** your personal music library in a sleek, web-based interface.  
Upload, stream, and manage your own music collection with **full privacy**.


## ✨ Features

- **🔒 Secure Access**  
  - Google OAuth2 authentication via Passport.js with JWT sessions  
  - “Guest Mode” when no OAuth provider is given

- **📂 Private Libraries**  
  - Organize music by user  
  - MP3/WAV uploads with automatic metadata extraction

- **🎵 Audio Streaming**  
  - Stream directly via Audio API  
  - Full playback controls, queue management, and lyrics tracking with LRCLib API

- **📜 Playlist Management**  
  - Create, edit, delete playlists  
  - Add/remove tracks and reorder them

- **🎨 Spotify-Inspired UI**  
  - Based on the August 2025 design of spotify web


## 🔐 Security

OpenMusic includes baseline security controls for production-minded self-hosting:

- Signed auth cookies and session cookies
- CSRF protection on state-changing API routes
- API rate limiting
- Safe upload-path validation for stream/delete operations
- Environment-driven secrets (`JWT_SECRET`, `SESSION_SECRET`, `COOKIE_SECRET`)

> **Recommendation:** Always use strong secrets, HTTPS in production, and a trusted reverse proxy.


## 📦 Installation

To run your own instance of OpenMusic:

```bash
# 1. Clone the repository
git clone https://github.com/JustKurayy/OpenMusic.git
cd OpenMusic

# 2. Copy the example env and configure
cp .env.example .env
# Fill in your variables

# 3. Install dependencies
npm install

# 4. Initialize database
npm run db:push

# 5. Start development
# 5. Start development server
npm run dev
```


## ⚙️ Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string. |
| `JWT_SECRET` | Recommended | Secret used to sign JWTs. |
| `SESSION_SECRET` | Recommended | Secret used by `express-session`. |
| `COOKIE_SECRET` | Recommended | Secret used to sign cookies. |
| `GOOGLE_CLIENT_ID` | Optional | Enables Google OAuth login when set with client secret. |
| `GOOGLE_CLIENT_SECRET` | Optional | Enables Google OAuth login when set with client ID. |
| `HOST` | Optional | Server bind host (default: `127.0.0.1`). |
| `PORT` | Optional | Server bind port (default: `5000`). |

---

## 🚀 Production Notes

- Build and run:
  ```bash
  npm run build
  npm run start
  ```
- Put OpenMusic behind HTTPS (Nginx, Caddy, Traefik, etc.).
- Restrict CORS and frontend URL configuration to your real domain(s).