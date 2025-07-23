import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import session from "express-session";
import { storage } from "./storage";
import { passport, authenticateToken, authenticateTokenOrGuest, optionalAuth, generateToken, isGoogleOAuthConfigured, createGuestUser } from "./auth";
import { upload, extractMetadata, streamAudio } from "./upload";
import { insertTrackSchema, insertPlaylistSchema, insertPlaylistTrackSchema } from "@shared/schema";
import path from "path";
import fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || "fallback_session_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }));

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Auth status endpoint
  app.get("/api/auth/status", (req, res) => {
    res.json({
      googleOAuthConfigured: isGoogleOAuthConfigured,
      guestModeAvailable: !isGoogleOAuthConfigured,
    });
  });

  // Guest login endpoint
  app.post("/api/auth/guest", (req, res) => {
    if (isGoogleOAuthConfigured) {
      return res.status(403).json({ message: "Guest mode not available when OAuth is configured" });
    }
    
    const guestUser = createGuestUser();
    const token = generateToken(guestUser);
    res.json({ token, user: guestUser });
  });

  // Auth routes (only if Google OAuth is configured)
  if (isGoogleOAuthConfigured) {
    app.get("/api/auth/google", 
      passport.authenticate("google", { scope: ["profile", "email"] })
    );

    app.get("/api/auth/google/callback",
      passport.authenticate("google", { failureRedirect: "/login" }),
      (req, res) => {
        const user = req.user as any;
        const token = generateToken(user);
        
        // Redirect to frontend with token
        res.redirect(`/?token=${token}`);
      }
    );
  }

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", authenticateTokenOrGuest, async (req, res) => {
    try {
      // Handle guest users
      if ((req as any).user.isGuest) {
        return res.json((req as any).user);
      }
      
      const user = await storage.getUser((req as any).user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Track routes
  app.get("/api/tracks", optionalAuth, async (req, res) => {
    try {
      const { search, my } = req.query;
      
      if (my === "true" && req.user) {
        const tracks = await storage.getTracksByUser(req.user.id);
        return res.json(tracks);
      }
      
      if (search && typeof search === "string") {
        const tracks = await storage.searchTracks(search, req.user?.id);
        return res.json(tracks);
      }
      
      const tracks = await storage.getAllTracks();
      res.json(tracks);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/tracks/:id", async (req, res) => {
    try {
      const track = await storage.getTrack(parseInt(req.params.id));
      if (!track) {
        return res.status(404).json({ message: "Track not found" });
      }
      res.json(track);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/tracks/upload", authenticateTokenOrGuest, upload.single("audio"), async (req, res) => {
    try {
      // Restrict guest users from uploading
      if ((req as any).user.isGuest) {
        return res.status(403).json({ 
          message: "Guest users cannot upload tracks. Please log in with Google to upload music." 
        });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const metadata = await extractMetadata(req.file.path, req.file.originalname);
      
      const trackData = {
        title: req.body.title || metadata.title,
        artist: req.body.artist || metadata.artist,
        album: req.body.album || metadata.album,
        duration: metadata.duration,
        filename: req.file.filename,
        filePath: req.file.path,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        userId: (req as any).user.id,
      };

      const validatedData = insertTrackSchema.parse(trackData);
      const track = await storage.createTrack({ ...validatedData, userId: (req as any).user.id });
      
      res.status(201).json(track);
    } catch (error: any) {
      // Clean up uploaded file if track creation fails
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(400).json({ 
        message: "Failed to upload track", 
        error: error.message 
      });
    }
  });

  app.delete("/api/tracks/:id", authenticateToken, async (req, res) => {
    try {
      const trackId = parseInt(req.params.id);
      const track = await storage.getTrack(trackId);
      
      if (!track) {
        return res.status(404).json({ message: "Track not found" });
      }
      
      if (track.userId !== (req as any).user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const deleted = await storage.deleteTrack(trackId, (req as any).user.id);
      if (!deleted) {
        return res.status(404).json({ message: "Track not found" });
      }
      
      // Delete file from disk
      if (fs.existsSync(track.filePath)) {
        fs.unlinkSync(track.filePath);
      }
      
      res.json({ message: "Track deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/tracks/:id/stream", async (req, res) => {
    try {
      const track = await storage.getTrack(parseInt(req.params.id));
      if (!track) {
        return res.status(404).json({ message: "Track not found" });
      }
      
      streamAudio(track.filePath, req, res);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Playlist routes
  app.get("/api/playlists", authenticateToken, async (req, res) => {
    try {
      const playlists = await storage.getPlaylistsByUser((req as any).user.id);
      res.json(playlists);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/playlists/:id", authenticateToken, async (req, res) => {
    try {
      const playlist = await storage.getPlaylist(parseInt(req.params.id));
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      
      if (playlist.userId !== (req as any).user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      res.json(playlist);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/playlists", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertPlaylistSchema.parse(req.body);
      const playlist = await storage.createPlaylist({ ...validatedData, userId: (req as any).user.id });
      res.status(201).json(playlist);
    } catch (error: any) {
      res.status(400).json({ 
        message: "Failed to create playlist", 
        error: error.message 
      });
    }
  });

  app.put("/api/playlists/:id", authenticateToken, async (req, res) => {
    try {
      const playlistId = parseInt(req.params.id);
      const validatedData = insertPlaylistSchema.partial().parse(req.body);
      
      const playlist = await storage.updatePlaylist(playlistId, validatedData, (req as any).user.id);
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      
      res.json(playlist);
    } catch (error: any) {
      res.status(400).json({ 
        message: "Failed to update playlist", 
        error: error.message 
      });
    }
  });

  app.delete("/api/playlists/:id", authenticateToken, async (req, res) => {
    try {
      const deleted = await storage.deletePlaylist(parseInt(req.params.id), (req as any).user.id);
      if (!deleted) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      res.json({ message: "Playlist deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Playlist track routes
  app.post("/api/playlists/:id/tracks", authenticateToken, async (req, res) => {
    try {
      const playlistId = parseInt(req.params.id);
      
      // Verify playlist ownership
      const playlist = await storage.getPlaylist(playlistId);
      if (!playlist || playlist.userId !== (req as any).user.id) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      
      const validatedData = insertPlaylistTrackSchema.parse({
        ...req.body,
        playlistId,
        position: req.body.position ?? playlist.tracks.length,
      });
      
      const playlistTrack = await storage.addTrackToPlaylist(validatedData);
      res.status(201).json(playlistTrack);
    } catch (error: any) {
      res.status(400).json({ 
        message: "Failed to add track to playlist", 
        error: error.message 
      });
    }
  });

  app.delete("/api/playlists/:playlistId/tracks/:trackId", authenticateToken, async (req, res) => {
    try {
      const playlistId = parseInt(req.params.playlistId);
      const trackId = parseInt(req.params.trackId);
      
      const removed = await storage.removeTrackFromPlaylist(playlistId, trackId, (req as any).user.id);
      if (!removed) {
        return res.status(404).json({ message: "Track not found in playlist" });
      }
      
      res.json({ message: "Track removed from playlist" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/playlists/:id/reorder", authenticateToken, async (req, res) => {
    try {
      const playlistId = parseInt(req.params.id);
      const { trackIds } = req.body;
      
      if (!Array.isArray(trackIds)) {
        return res.status(400).json({ message: "trackIds must be an array" });
      }
      
      const success = await storage.reorderPlaylistTracks(playlistId, trackIds, (req as any).user.id);
      if (!success) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      
      res.json({ message: "Playlist reordered successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
