import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import session from "express-session";
import { storage } from "./storage";
import {
    passport,
    authenticateUserOrGuest,
    generateToken,
    isGoogleOAuthConfigured,
    createGuestUser,
} from "./auth";
import {
    upload,
    extractMetadata,
    extractMetadataPreview,
    streamAudio,
} from "./upload";
import {
    insertTrackSchema,
    updateTrackSchema,
    insertPlaylistSchema,
    insertPlaylistTrackSchema,
} from "@shared/schema";
import path from "path";
import fs from "fs";
import { WebSocketServer } from "ws";
import { spotifyEmitter, startSpotifyDownload } from "./spotify";
import crypto from "crypto";
import cookieParser from "cookie-parser";
import cors from "cors";
import { resolveUploadPath } from "./upload";

type RateLimitEntry = {
    count: number;
    resetAt: number;
};

function createRateLimitMiddleware(
    limit: number,
    windowMs: number,
    message = "Too many requests"
) {
    const entries = new Map<string, RateLimitEntry>();

    return (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) => {
        const key = `${req.ip}:${req.path}`;
        const now = Date.now();
        const existing = entries.get(key);

        if (!existing || now > existing.resetAt) {
            entries.set(key, { count: 1, resetAt: now + windowMs });
            return next();
        }

        if (existing.count >= limit) {
            const retryAfterSeconds = Math.ceil(
                (existing.resetAt - now) / 1000
            );
            res.set("Retry-After", retryAfterSeconds.toString());
            return res.status(429).json({ message });
        }

        existing.count += 1;
        return next();
    };
}

function csrfProtection(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) {
    const csrfMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
    const csrfCookieName = "csrf_token";
    const csrfHeader = "x-csrf-token";

    if (!req.cookies[csrfCookieName]) {
        res.cookie(csrfCookieName, crypto.randomBytes(32).toString("hex"), {
            httpOnly: false,
            sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 24 * 60 * 60 * 1000,
            path: "/",
        });
    }

    if (!csrfMethods.has(req.method)) {
        return next();
    }

    const cookieToken = req.cookies[csrfCookieName];
    const headerToken = req.get(csrfHeader);
    if (cookieToken && headerToken && cookieToken === headerToken) {
        return next();
    }

    const trustedOrigins = new Set<string>([
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
    ]);
    if (process.env.FRONTEND_URL) {
        trustedOrigins.add(process.env.FRONTEND_URL);
    }

    const requestOrigin = req.get("origin");
    const requestReferer = req.get("referer");
    const hostOrigin = `${req.protocol}://${req.get("host")}`;

    const isTrustedOrigin =
        (requestOrigin && trustedOrigins.has(requestOrigin)) ||
        (requestReferer &&
            Array.from(trustedOrigins).some((trusted) =>
                requestReferer.startsWith(trusted)
            )) ||
        (requestOrigin && requestOrigin === hostOrigin);

    if (isTrustedOrigin) {
        return next();
    }

    return res.status(403).json({ message: "Invalid CSRF token" });
}

export async function registerRoutes(app: Express): Promise<Server> {
    const sessionSecret =
        process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
    const cookieSecret =
        process.env.COOKIE_SECRET || crypto.randomBytes(32).toString("hex");
    const apiLimiter = createRateLimitMiddleware(
        120,
        60 * 1000,
        "Rate limit exceeded"
    );

    app.use(
        cors({
            origin: "http://localhost:5173", // Change to your frontend URL if needed
            credentials: true,
        })
    );

    app.use(cookieParser(cookieSecret));
    app.use("/api", apiLimiter);
    app.use(csrfProtection);

    // Session configuration
    app.use(
        session({
            secret: sessionSecret,
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: process.env.NODE_ENV === "production",
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
            },
        })
    );

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
            return res.status(403).json({
                message: "Guest mode not available when OAuth is configured",
            });
        }
        const guestUser = createGuestUser();
        const token = generateToken(guestUser);
        // For local dev, use lax/false; for prod, use none/true
        res.cookie("token", token, {
            httpOnly: true,
            signed: true,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: "/",
        });
        res.json({ user: guestUser });
    });

    // Auth routes (only if Google OAuth is configured)
    if (isGoogleOAuthConfigured) {
        app.get(
            "/api/auth/google",
            passport.authenticate("google", { scope: ["profile", "email"] })
        );

        app.get(
            "/api/auth/google/callback",
            passport.authenticate("google", {
                failureRedirect: "/login",
                session: false,
            }),
            (req, res) => {
                try {
                    const user = req.user as any;
                    if (!user) {
                        return res.redirect("/login?error=auth_failed");
                    }
                    const token = generateToken(user);
                    res.cookie("token", token, {
                        httpOnly: true,
                        signed: true,
                        sameSite:
                            process.env.NODE_ENV === "production"
                                ? "none"
                                : "lax",
                        secure: process.env.NODE_ENV === "production",
                        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                        path: "/",
                    });
                    // Redirect to frontend root (SPA will pick up user from /api/auth/me)
                    res.redirect("/");
                } catch (err) {
                    console.error("[GOOGLE OAUTH CALLBACK ERROR]", err);
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
                signed: true,
                sameSite:
                    process.env.NODE_ENV === "production" ? "none" : "lax",
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

    // Extract metadata preview (no permanent save, parses tags and returns base64 cover art)
    app.post(
        "/api/tracks/extract-metadata",
        authenticateUserOrGuest,
        upload.single("audio"),
        async (req, res) => {
            try {
                if (!req.file) {
                    return res
                        .status(400)
                        .json({ message: "No file uploaded" });
                }
                const metadata = await extractMetadataPreview(
                    req.file.path,
                    req.file.originalname
                );
                // Delete the temp file — it was only needed for tag parsing
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                res.json(metadata);
            } catch (error: any) {
                if (req.file && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                res.status(500).json({ message: "Failed to extract metadata" });
            }
        }
    );

    // Track routes
    app.get("/api/tracks", authenticateUserOrGuest, async (req, res) => {
        try {
            const { search, my } = req.query;
            const user = req.user;

            // Handle undefined user
            if (!user) {
                // No authenticated user - return empty array or handle as guest
                // For guest mode, return all tracks
                return res.json([]);
            }

            let tracks;
            if (my === "true") {
                tracks = await storage.getTracksByUser((user as any).id);
            } else if (search) {
                // For search, allow all authenticated users to search all tracks
                tracks = await storage.searchTracks(search as string);
            } else {
                // Show only current user's tracks, or all tracks if guest
                if ((user as any).isGuest) {
                    tracks = await storage.getAllTracks();
                } else {
                    tracks = await storage.getTracksByUser((user as any).id);
                }
            }
            res.json(tracks);
        } catch (error) {
            console.error("[API /api/tracks] Error:", error);
            res.status(500).json({
                message: "Server error",
                error: error instanceof Error ? error.message : String(error),
            });
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
            console.error("[API /api/tracks/:id] Error:", error);
            res.status(500).json({
                message: "Server error",
                error: error instanceof Error ? error.message : String(error),
            });
        }
    });

    app.put("/api/tracks/:id", authenticateUserOrGuest, async (req, res) => {
        try {
            if (!req.user || (req.user as any).isGuest) {
                return res.status(401).json({ message: "Not authenticated" });
            }

            const trackId = parseInt(req.params.id);
            const validatedData = updateTrackSchema.parse(req.body);
            const updatedTrack = await storage.updateTrack(
                trackId,
                validatedData,
                (req.user as any).id
            );

            if (!updatedTrack) {
                return res.status(404).json({ message: "Track not found" });
            }

            res.json(updatedTrack);
        } catch (error: any) {
            res.status(400).json({
                message: "Failed to update track",
                error: error.message,
            });
        }
    });

    app.post(
        "/api/tracks/upload",
        authenticateUserOrGuest,
        upload.single("audio"),
        async (req, res) => {
            try {
                if (!req.user || (req.user as any).isGuest) {
                    return res.status(403).json({
                        message:
                            "Guest users cannot upload tracks. Please log in with Google to upload music.",
                    });
                }
                if (!req.file) {
                    return res
                        .status(400)
                        .json({ message: "No file uploaded" });
                }
                const metadata = await extractMetadata(
                    req.file.path,
                    req.file.originalname
                );
                const trackData = {
                    title: req.body.title || metadata.title,
                    artist: req.body.artist || metadata.artist,
                    album: req.body.album || metadata.album || null,
                    trackNumber: metadata.trackNumber ?? null,
                    coverArt: metadata.coverArtPath ?? null,
                    duration: metadata.duration,
                    filename: req.file.filename,
                    filePath: req.file.path,
                    mimeType: req.file.mimetype,
                    fileSize: req.file.size,
                    userId: (req.user as any).id,
                };
                const validatedData = insertTrackSchema.parse(trackData);
                const track = await storage.createTrack({
                    ...validatedData,
                    userId: (req.user as any).id,
                });
                res.status(201).json(track);
            } catch (error: any) {
                if (req.file && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                res.status(400).json({
                    message: "Failed to upload track",
                    error: error.message,
                });
            }
        }
    );

    app.delete("/api/tracks/:id", authenticateUserOrGuest, async (req, res) => {
        try {
            if (!req.user)
                return res.status(401).json({ message: "Not authenticated" });
            const trackId = parseInt(req.params.id);
            const track = await storage.getTrack(trackId);
            if (!track) {
                return res.status(404).json({ message: "Track not found" });
            }
            if (track.userId !== (req.user as any).id) {
                return res.status(403).json({ message: "Unauthorized" });
            }
            const deleted = await storage.deleteTrack(
                trackId,
                (req.user as any).id
            );
            if (!deleted) {
                return res.status(404).json({ message: "Track not found" });
            }
            const safePath = resolveUploadPath(track.filePath);
            if (safePath && fs.existsSync(safePath)) {
                fs.unlinkSync(safePath);
            }
            res.json({ message: "Track deleted successfully" });
        } catch (error) {
            console.error("[API /api/tracks/:id] Delete Error:", error);
            res.status(500).json({
                message: "Server error",
                error: error instanceof Error ? error.message : String(error),
            });
        }
    });

    app.get(
        "/api/tracks/:id/stream",
        authenticateUserOrGuest,
        async (req, res) => {
            try {
                const track = await storage.getTrack(parseInt(req.params.id));
                if (!track) {
                    return res.status(404).json({ message: "Track not found" });
                }
                streamAudio(track.filePath, req, res);
            } catch (error) {
                console.error("[API /api/tracks/:id/stream] Error:", error);
                res.status(500).json({
                    message: "Server error",
                    error:
                        error instanceof Error ? error.message : String(error),
                });
            }
        }
    );

    // Serve track cover art
    app.get(
        "/api/tracks/:id/artwork",
        authenticateUserOrGuest,
        async (req, res) => {
            try {
                const track = await storage.getTrack(parseInt(req.params.id));
                if (!track || !(track as any).coverArt) {
                    return res
                        .status(404)
                        .json({ message: "No artwork found" });
                }
                const safePath = resolveUploadPath((track as any).coverArt);
                if (!safePath || !fs.existsSync(safePath)) {
                    return res
                        .status(404)
                        .json({ message: "Artwork file not found" });
                }
                const mimeType = (track as any).coverArt.endsWith(".png")
                    ? "image/png"
                    : "image/jpeg";
                res.setHeader("Content-Type", mimeType);
                res.setHeader("Cache-Control", "public, max-age=31536000");
                fs.createReadStream(safePath).pipe(res);
            } catch (error) {
                console.error("[API /api/tracks/:id/artwork] Error:", error);
                res.status(500).json({
                    message: "Server error",
                    error:
                        error instanceof Error ? error.message : String(error),
                });
            }
        }
    );

    // Playlist routes
    app.get("/api/playlists", authenticateUserOrGuest, async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Not authenticated" });
            }
            // Get current user's playlists, or guest's playlist (by user id 0)
            const userId = (req.user as any).isGuest ? 0 : (req.user as any).id;
            const playlists = await storage.getPlaylistsByUser(userId);
            res.json(playlists);
        } catch (error) {
            console.error("[API /api/playlists] Error:", error);
            res.status(500).json({
                message: "Server error",
                error: error instanceof Error ? error.message : String(error),
            });
        }
    });

    app.get("/api/playlists/:id", authenticateUserOrGuest, async (req, res) => {
        try {
            if (!req.user)
                return res.status(401).json({ message: "Not authenticated" });
            const playlist = await storage.getPlaylist(parseInt(req.params.id));
            if (!playlist) {
                return res.status(404).json({ message: "Playlist not found" });
            }
            // Allow authenticated users to view any playlist (not just their own)
            // Guest users can only view their own playlists
            if (
                playlist.userId !== (req.user as any).id &&
                (req.user as any).isGuest
            ) {
                return res.status(403).json({ message: "Unauthorized" });
            }
            res.json(playlist);
        } catch (error) {
            console.error("[API /api/playlists/:id] Error:", error);
            res.status(500).json({
                message: "Server error",
                error: error instanceof Error ? error.message : String(error),
            });
        }
    });

    app.post("/api/playlists", authenticateUserOrGuest, async (req, res) => {
        try {
            if (!req.user)
                return res.status(401).json({ message: "Not authenticated" });
            const validatedData = insertPlaylistSchema.parse(req.body);
            const playlist = await storage.createPlaylist({
                ...validatedData,
                userId: (req.user as any).id,
            });
            res.status(201).json(playlist);
        } catch (error: any) {
            res.status(400).json({
                message: "Failed to create playlist",
                error: error.message,
            });
        }
    });

    app.put("/api/playlists/:id", authenticateUserOrGuest, async (req, res) => {
        try {
            if (!req.user)
                return res.status(401).json({ message: "Not authenticated" });
            const playlistId = parseInt(req.params.id);
            const validatedData = insertPlaylistSchema
                .partial()
                .parse(req.body);
            const playlist = await storage.updatePlaylist(
                playlistId,
                validatedData,
                (req.user as any).id
            );
            if (!playlist) {
                return res.status(404).json({ message: "Playlist not found" });
            }
            res.json(playlist);
        } catch (error: any) {
            res.status(400).json({
                message: "Failed to update playlist",
                error: error.message,
            });
        }
    });

    app.delete(
        "/api/playlists/:id",
        authenticateUserOrGuest,
        async (req, res) => {
            try {
                if (!req.user)
                    return res
                        .status(401)
                        .json({ message: "Not authenticated" });
                const deleted = await storage.deletePlaylist(
                    parseInt(req.params.id),
                    (req.user as any).id
                );
                if (!deleted) {
                    return res
                        .status(404)
                        .json({ message: "Playlist not found" });
                }
                res.json({ message: "Playlist deleted successfully" });
            } catch (error) {
                console.error("[API /api/playlists/:id] Delete Error:", error);
                res.status(500).json({
                    message: "Server error",
                    error:
                        error instanceof Error ? error.message : String(error),
                });
            }
        }
    );

    // Playlist track routes
    app.post(
        "/api/playlists/:id/tracks",
        authenticateUserOrGuest,
        async (req, res) => {
            try {
                if (!req.user)
                    return res
                        .status(401)
                        .json({ message: "Not authenticated" });
                const playlistId = parseInt(req.params.id);
                const playlist = await storage.getPlaylist(playlistId);
                if (!playlist || playlist.userId !== (req.user as any).id) {
                    return res
                        .status(404)
                        .json({ message: "Playlist not found" });
                }
                const validatedData = insertPlaylistTrackSchema.parse({
                    ...req.body,
                    playlistId,
                    position: req.body.position ?? playlist.tracks.length,
                });
                const playlistTrack =
                    await storage.addTrackToPlaylist(validatedData);
                res.status(201).json(playlistTrack);
            } catch (error: any) {
                console.error("[API /api/playlists/:id/tracks] Error:", error);
                res.status(400).json({
                    message: "Failed to add track to playlist",
                    error: error.message,
                });
            }
        }
    );

    app.delete(
        "/api/playlists/:playlistId/tracks/:trackId",
        authenticateUserOrGuest,
        async (req, res) => {
            try {
                if (!req.user)
                    return res
                        .status(401)
                        .json({ message: "Not authenticated" });
                const playlistId = parseInt(req.params.playlistId);
                const trackId = parseInt(req.params.trackId);
                const removed = await storage.removeTrackFromPlaylist(
                    playlistId,
                    trackId,
                    (req.user as any).id
                );
                if (!removed) {
                    return res
                        .status(404)
                        .json({ message: "Track not found in playlist" });
                }
                res.json({ message: "Track removed from playlist" });
            } catch (error) {
                console.error(
                    "[API /api/playlists/:playlistId/tracks/:trackId] Error:",
                    error
                );
                res.status(500).json({
                    message: "Server error",
                    error:
                        error instanceof Error ? error.message : String(error),
                });
            }
        }
    );

    app.put(
        "/api/playlists/:id/reorder",
        authenticateUserOrGuest,
        async (req, res) => {
            try {
                if (!req.user)
                    return res
                        .status(401)
                        .json({ message: "Not authenticated" });
                const playlistId = parseInt(req.params.id);
                const { trackIds } = req.body;
                if (!Array.isArray(trackIds)) {
                    return res
                        .status(400)
                        .json({ message: "trackIds must be an array" });
                }
                const success = await storage.reorderPlaylistTracks(
                    playlistId,
                    trackIds,
                    (req.user as any).id
                );
                if (!success) {
                    return res
                        .status(404)
                        .json({ message: "Playlist not found" });
                }
                res.json({ message: "Playlist reordered successfully" });
            } catch (error) {
                console.error("[API /api/playlists/:id/reorder] Error:", error);
                res.status(500).json({
                    message: "Server error",
                    error:
                        error instanceof Error ? error.message : String(error),
                });
            }
        }
    );

    // User likes API endpoints
    app.post("/api/likes/add", authenticateUserOrGuest, async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Not authenticated" });
            }
            const { trackId } = req.body;
            if (!trackId) {
                return res.status(400).json({ message: "trackId is required" });
            }
            const like = await storage.addLike(
                (req.user as any).id,
                parseInt(trackId)
            );
            res.status(201).json(like);
        } catch (error: any) {
            res.status(400).json({
                message: "Failed to add like",
                error: error.message,
            });
        }
    });

    app.delete(
        "/api/likes/remove",
        authenticateUserOrGuest,
        async (req, res) => {
            try {
                if (!req.user) {
                    return res
                        .status(401)
                        .json({ message: "Not authenticated" });
                }
                const { trackId } = req.body;
                if (!trackId) {
                    return res
                        .status(400)
                        .json({ message: "trackId is required" });
                }
                const removed = await storage.removeLike(
                    (req.user as any).id,
                    parseInt(trackId)
                );
                res.json({ removed });
            } catch (error) {
                console.error("[API /api/likes/remove] Error:", error);
                res.status(500).json({
                    message: "Server error",
                    error:
                        error instanceof Error ? error.message : String(error),
                });
            }
        }
    );

    app.get(
        "/api/likes/is-liked",
        authenticateUserOrGuest,
        async (req, res) => {
            try {
                if (!req.user) {
                    return res
                        .status(401)
                        .json({ message: "Not authenticated" });
                }
                const { trackId } = req.query;
                if (!trackId) {
                    return res
                        .status(400)
                        .json({ message: "trackId is required" });
                }
                const liked = await storage.isLiked(
                    (req.user as any).id,
                    parseInt(trackId as string)
                );
                res.json({ liked });
            } catch (error) {
                console.error("[API /api/likes/is-liked] Error:", error);
                res.status(500).json({
                    message: "Server error",
                    error:
                        error instanceof Error ? error.message : String(error),
                });
            }
        }
    );

    app.get("/api/likes/user", authenticateUserOrGuest, async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "Not authenticated" });
            }
            const likes = await storage.getUserLikes((req.user as any).id);
            res.json(likes);
        } catch (error) {
            console.error("[API /api/likes/user] Error:", error);
            res.status(500).json({
                message: "Server error",
                error: error instanceof Error ? error.message : String(error),
            });
        }
    });

    // History API endpoints
    app.post(
        "/api/history/record",
        authenticateUserOrGuest,
        async (req, res) => {
            try {
                if (!req.user) {
                    return res
                        .status(401)
                        .json({ message: "Not authenticated" });
                }
                const { trackId } = req.body;
                if (!trackId) {
                    return res
                        .status(400)
                        .json({ message: "trackId is required" });
                }
                const history = await storage.recordPlay(
                    (req.user as any).id,
                    parseInt(trackId)
                );
                res.json(history);
            } catch (error: any) {
                res.status(500).json({
                    message: "Failed to record play",
                    error: error.message,
                });
            }
        }
    );

    app.get(
        "/api/history/replay",
        authenticateUserOrGuest,
        async (req, res) => {
            try {
                if (!req.user) {
                    return res
                        .status(401)
                        .json({ message: "Not authenticated" });
                }
                const limit =
                    parseInt((req.query.limit as string) || "10") || 10;
                const history = await storage.getRecentPlays(
                    (req.user as any).id,
                    limit
                );
                res.json(history);
            } catch (error: any) {
                res.status(500).json({
                    message: "Failed to get recent plays",
                    error: error.message,
                });
            }
        }
    );

    // Lyrics API endpoint
    app.get("/api/lyrics", authenticateUserOrGuest, async (req, res) => {
        try {
            const { title, artist } = req.query;

            if (!title || !artist) {
                return res
                    .status(400)
                    .json({ message: "Title and artist are required" });
            }

            // Search for lyrics using LRClib API
            const searchUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(title as string)}&artist_name=${encodeURIComponent(artist as string)}`;
            console.log("[DEBUG] Fetching lyrics from:", searchUrl);
            const searchResponse = await fetch(searchUrl, {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115.0.0.0 Safari/537.36",
                },
            });
            if (!searchResponse.ok) {
                return res.status(404).json({ message: "Lyrics not found" });
            }

            const searchResults = await searchResponse.json();

            // LRClib returns an array of results, not an object with 'data'
            const results = Array.isArray(searchResults)
                ? searchResults
                : searchResults.data;
            if (!results || results.length === 0) {
                return res.status(404).json({ message: "Lyrics not found" });
            }

            // Robust match for track and artist
            const normalize = (str: string) =>
                str
                    .toLowerCase()
                    .replace(/[^a-z0-9]/gi, "")
                    .trim();
            const titleNorm = normalize(title as string);
            const artistNorm = normalize(artist as string);
            const match = results.find(
                (item: any) =>
                    item.trackName &&
                    item.artistName &&
                    normalize(item.trackName) === titleNorm &&
                    normalize(item.artistName) === artistNorm
            );
            if (!match) {
                return res.status(404).json({ message: "Lyrics not found" });
            }

            // Fetch the actual lyrics
            const lyricsUrl = `https://lrclib.net/api/get/${match.id}`;
            const lyricsResponse = await fetch(lyricsUrl, {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115.0.0.0 Safari/537.36",
                },
            });
            if (!lyricsResponse.ok) {
                return res.status(404).json({ message: "Lyrics not found" });
            }

            const lyricsData = await lyricsResponse.json();
            res.json({
                lyrics: lyricsData.syncedLyrics || lyricsData.plainLyrics,
                synced: !!lyricsData.syncedLyrics,
                source: "LRClib",
            });
        } catch (error) {
            res.status(500).json({ message: "Failed to fetch lyrics" });
        }
    });

    // Spotify Download endpoint
    app.post(
        "/api/spotify/download",
        authenticateUserOrGuest,
        async (req, res) => {
            try {
                const user = req.user as any;
                if (!user || (user as any).isGuest) {
                    return res.status(403).json({
                        message: "Login required to download from Spotify",
                    });
                }
                const { url } = req.body || {};
                if (
                    !url ||
                    !/open\.spotify\.com\/(track|playlist|album|artist)\//.test(
                        url
                    )
                ) {
                    return res
                        .status(400)
                        .json({ message: "Invalid Spotify URL" });
                }

                // kick off async download — progress emitted over websocket
                startSpotifyDownload((user as any).id, url).catch((err) => {
                    spotifyEmitter.emit("error", {
                        userId: (user as any).id,
                        error: String(err),
                    });
                });

                return res.status(202).json({ message: "Download started" });
            } catch (error) {
                return res
                    .status(500)
                    .json({ message: "Failed to start download" });
            }
        }
    );

    const httpServer = createServer(app);
    // Attach WebSocket server for real-time spotify download progress
    try {
        const wss = new WebSocketServer({
            server: httpServer,
            path: "/ws/spotify",
        });

        // Each connection may subscribe to a specific userId.
        (wss as any).on("connection", (ws: any, req: any) => {
            ws.subscribedUserId = null;

            ws.on("message", (msg: any) => {
                try {
                    const parsed = JSON.parse(msg.toString());
                    if (parsed?.action === "subscribe" && parsed?.userId) {
                        ws.subscribedUserId = parsed.userId;
                    }
                } catch (e) {
                    // ignore
                }
            });
        });

        const forward = (eventName: string) => (payload: any) => {
            const msg = JSON.stringify({
                event: "spotify-download-progress",
                data: payload,
            });
            wss.clients.forEach((client: any) => {
                try {
                    if (client && (client as any).readyState === 1) {
                        // If client subscribed to a userId, only send matching events
                        const sub = (client as any).subscribedUserId;
                        if (sub == null || sub === payload.userId) {
                            client.send(msg);
                        }
                    }
                } catch (e) {
                    // swallow send errors
                }
            });
        };

        spotifyEmitter.on("progress", forward("progress"));
        spotifyEmitter.on("complete", forward("complete"));
        spotifyEmitter.on("error", forward("error"));
        spotifyEmitter.on("log", forward("log"));
    } catch (err) {
        console.error(
            "Failed to start WebSocket server for spotify downloads",
            err
        );
    }
    return httpServer;
}
