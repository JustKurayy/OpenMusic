# MusicStream - Spotify Alternative

## Overview

MusicStream is a full-stack music streaming web application that provides a Spotify-like experience. Users can upload, stream, and organize their music with playlist functionality, all secured through Google OAuth2 authentication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with a dark Spotify-inspired theme
- **Routing**: Wouter for client-side routing
- **State Management**: React Context API for auth and music player state
- **Data Fetching**: TanStack React Query for server state management
- **Audio Playback**: HTML5 Audio API wrapped in a custom context provider

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with Google OAuth2 strategy and JWT tokens
- **File Upload**: Multer middleware for handling audio file uploads
- **Audio Processing**: music-metadata library for extracting audio metadata

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **File Storage**: Local filesystem storage in uploads directory (organized by user ID)
- **Session Storage**: Express sessions with optional PostgreSQL session store

## Key Components

### Authentication System
- **OAuth2 Flow**: Google OAuth2 for user authentication
- **JWT Tokens**: Secure token-based authentication for API requests
- **Session Management**: Express sessions with persistent storage
- **User Management**: User profiles with Google ID linking

### Audio Management
- **File Upload**: Supports MP3 and WAV formats with metadata extraction
- **Audio Streaming**: Direct file streaming from server storage
- **Metadata Processing**: Automatic extraction of title, artist, album, and duration
- **File Organization**: User-specific directory structure for uploaded files

### Music Player System
- **Global Player State**: React Context managing playback across the app
- **Queue Management**: Support for play queues and track navigation
- **Playback Controls**: Play/pause, seek, volume, next/previous functionality
- **Progress Tracking**: Real-time playback position updates

### Playlist Management
- **CRUD Operations**: Create, read, update, delete playlists
- **Track Association**: Add/remove tracks from playlists with position tracking
- **User Ownership**: Playlists scoped to individual users
- **Reordering**: Support for changing track order within playlists

### UI Components
- **Spotify-Inspired Design**: Dark theme with green accent colors
- **Responsive Layout**: Mobile-friendly design with adaptive components
- **Component Library**: Comprehensive UI components using shadcn/ui
- **Audio Visualizations**: Track lists, player controls, and progress bars

## Data Flow

### User Authentication Flow
1. User clicks "Continue with Google" on login page
2. Redirected to Google OAuth2 consent screen
3. Google callback creates or updates user record
4. JWT token generated and sent to frontend
5. Token stored in localStorage for subsequent requests

### Audio Upload Flow
1. User selects audio files through upload interface
2. Files validated for format and metadata extracted
3. Files stored in user-specific directory structure
4. Track records created in database with metadata
5. UI updated to reflect new tracks

### Music Playback Flow
1. User selects track to play from any track list
2. Player context updates with new track and queue
3. Audio element source updated to stream endpoint
4. Playback controls and progress UI synchronized with audio state
5. Queue management handles track transitions

### Data Synchronization
- React Query manages server state caching and synchronization
- Optimistic updates for immediate UI feedback
- Automatic background refetching for data freshness
- Error boundaries and retry logic for network failures

## External Dependencies

### Core Dependencies
- **Database**: @neondatabase/serverless for PostgreSQL connection
- **ORM**: drizzle-orm for type-safe database operations
- **Authentication**: passport and passport-google-oauth20 for OAuth2
- **File Processing**: multer for uploads, music-metadata for audio metadata
- **UI Components**: @radix-ui/* packages for accessible component primitives

### Development Tools
- **Build Tool**: Vite with React plugin and TypeScript support
- **Database Migrations**: drizzle-kit for schema management
- **Code Quality**: TypeScript for type safety
- **Styling**: Tailwind CSS with PostCSS processing

### Runtime Environment
- **Session Management**: express-session with optional connect-pg-simple
- **Security**: JWT for token-based authentication
- **File System**: Node.js fs module for file operations
- **HTTP Client**: Fetch API for frontend API calls

## Deployment Strategy

### Build Process
- Frontend built with Vite to static assets in dist/public
- Backend compiled with esbuild to single bundle in dist/
- Database schema applied with drizzle-kit push command
- Environment variables required for database and Google OAuth

### Production Configuration
- NODE_ENV=production for optimized builds
- Database connection via DATABASE_URL environment variable
- Google OAuth credentials via GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
- JWT secret via JWT_SECRET environment variable
- Session secret via SESSION_SECRET environment variable

### File Storage Considerations
- Local file storage in uploads/ directory
- User-specific subdirectories for organization
- File streaming endpoints for audio delivery
- Consider cloud storage migration for scalability

### Security Measures
- JWT token expiration and validation
- CORS configuration for cross-origin requests
- File type validation for uploads
- User-scoped data access controls
- Session security with secure cookies in production