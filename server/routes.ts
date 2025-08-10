import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import session from "express-session";
import { storage } from "./storage";
import { passport, authenticateUserOrGuest, generateToken, isGoogleOAuthConfigured, createGuestUser } from "./auth";
import { upload, extractMetadata, streamAudio } from "./upload";
import { insertTrackSchema, insertPlaylistSchema, insertPlaylistTrackSchema } from "@shared/schema";
import path from "path";
import fs from "fs";
import cookieParser from "cookie-parser";
import cors from "cors";

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(cors({
    origin: "http://localhost:5173", // Change to your frontend URL if needed
    credentials: true,
  }));

  app.use(cookieParser());

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
    console.log("[DEBUG] /api/auth/status:", {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      isGoogleOAuthConfigured,
    });
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
    // For local dev, use lax/false; for prod, use none/true
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });
    res.json({ user: guestUser });
  });

  // Auth routes (only if Google OAuth is configured)
  if (isGoogleOAuthConfigured) {
    app.get("/api/auth/google", 
      passport.authenticate("google", { scope: ["profile", "email"] })
    );

    app.get("/api/auth/google/callback",
      passport.authenticate("google", { failureRedirect: "/login", session: false }),
      (req, res) => {
        try {
          const user = req.user as any;
          if (!user) {
            return res.redirect("/login?error=auth_failed");
          }
          const token = generateToken(user);
          res.cookie("token", token, {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: "/",
          });
          // Redirect to frontend root (SPA will pick up user from /api/auth/me)
          res.redirect("/");
        } catch (err) {
          console.error('[GOOGLE OAUTH CALLBACK ERROR]', err);
          res.redirect("/login?error=server_error");
        }
      }
    );
  }

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      res.clearCookie("token", {
        path: "/",
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        secure: process.env.NODE_ENV === "production",
      });
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", authenticateUserOrGuest, (req, res) => {
    if (req.user) {
      return res.json(req.user);
    } else {
      // Not logged in, treat as guest (or return 401 if you want to block guests)
      return res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Track routes
  app.get("/api/tracks", authenticateUserOrGuest, async (req, res) => {
    try {
      const { search, my } = req.query;
      // You can use req.user here if needed
      const tracks = await storage.getAllTracks();
      res.json(tracks);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/tracks/:id", authenticateUserOrGuest, async (req, res) => {
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

  app.post("/api/tracks/upload", authenticateUserOrGuest, upload.single("audio"), async (req, res) => {
    try {
      if (!req.user || (req.user as any).isGuest) {
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
        userId: (req.user as any).id,
      };
      const validatedData = insertTrackSchema.parse(trackData);
      const track = await storage.createTrack({ ...validatedData, userId: (req.user as any).id });
      res.status(201).json(track);
    } catch (error: any) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(400).json({ 
        message: "Failed to upload track", 
        error: error.message 
      });
    }
  });

  app.delete("/api/tracks/:id", authenticateUserOrGuest, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const trackId = parseInt(req.params.id);
      const track = await storage.getTrack(trackId);
      if (!track) {
        return res.status(404).json({ message: "Track not found" });
      }
      if (track.userId !== (req.user as any).id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      const deleted = await storage.deleteTrack(trackId, (req.user as any).id);
      if (!deleted) {
        return res.status(404).json({ message: "Track not found" });
      }
      if (fs.existsSync(track.filePath)) {
        fs.unlinkSync(track.filePath);
      }
      res.json({ message: "Track deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/tracks/:id/stream", authenticateUserOrGuest, async (req, res) => {
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
  app.get("/api/playlists", authenticateUserOrGuest, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const playlists = await storage.getPlaylistsByUser((req.user as any).id);
      res.json(playlists);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/playlists/:id", authenticateUserOrGuest, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const playlist = await storage.getPlaylist(parseInt(req.params.id));
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      if (playlist.userId !== (req.user as any).id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      res.json(playlist);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/playlists", authenticateUserOrGuest, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const validatedData = insertPlaylistSchema.parse(req.body);
      const playlist = await storage.createPlaylist({ ...validatedData, userId: (req.user as any).id });
      res.status(201).json(playlist);
    } catch (error: any) {
      res.status(400).json({ 
        message: "Failed to create playlist", 
        error: error.message 
      });
    }
  });

  app.put("/api/playlists/:id", authenticateUserOrGuest, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const playlistId = parseInt(req.params.id);
      const validatedData = insertPlaylistSchema.partial().parse(req.body);
      const playlist = await storage.updatePlaylist(playlistId, validatedData, (req.user as any).id);
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

  app.delete("/api/playlists/:id", authenticateUserOrGuest, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const deleted = await storage.deletePlaylist(parseInt(req.params.id), (req.user as any).id);
      if (!deleted) {
        return res.status(404).json({ message: "Playlist not found" });
      }
      res.json({ message: "Playlist deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Playlist track routes
  app.post("/api/playlists/:id/tracks", authenticateUserOrGuest, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const playlistId = parseInt(req.params.id);
      const playlist = await storage.getPlaylist(playlistId);
      if (!playlist || playlist.userId !== (req.user as any).id) {
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

  app.delete("/api/playlists/:playlistId/tracks/:trackId", authenticateUserOrGuest, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const playlistId = parseInt(req.params.playlistId);
      const trackId = parseInt(req.params.trackId);
      const removed = await storage.removeTrackFromPlaylist(playlistId, trackId, (req.user as any).id);
      if (!removed) {
        return res.status(404).json({ message: "Track not found in playlist" });
      }
      res.json({ message: "Track removed from playlist" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/playlists/:id/reorder", authenticateUserOrGuest, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const playlistId = parseInt(req.params.id);
      const { trackIds } = req.body;
      if (!Array.isArray(trackIds)) {
        return res.status(400).json({ message: "trackIds must be an array" });
      }
      const success = await storage.reorderPlaylistTracks(playlistId, trackIds, (req.user as any).id);
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
