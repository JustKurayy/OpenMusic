import { spawn, spawnSync } from "child_process";
import { EventEmitter } from "events";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { extractMetadata } from "./upload";

export const spotifyEmitter = new EventEmitter();
const activeDownloads = new Map<number, boolean>();

function findSpotdlCommand(): { cmd: string; mode: "exe" | "module" } {
    // Prefer the `spotdl` executable if available
    try {
        const res = spawnSync("spotdl", ["--version"], { stdio: "ignore" });
        if (res.status === 0) return { cmd: "spotdl", mode: "exe" };
    } catch (e) {
        // ignore
    }

    // Try Windows launcher
    try {
        const res = spawnSync("py", ["-m", "spotdl", "--version"], { stdio: "ignore" });
        if (res.status === 0) return { cmd: "py", mode: "module" };
    } catch (e) {}

    // Try python3
    try {
        const res = spawnSync("python3", ["-m", "spotdl", "--version"], { stdio: "ignore" });
        if (res.status === 0) return { cmd: "python3", mode: "module" };
    } catch (e) {}

    // Try python
    try {
        const res = spawnSync("python", ["-m", "spotdl", "--version"], { stdio: "ignore" });
        if (res.status === 0) return { cmd: "python", mode: "module" };
    } catch (e) {}

    throw new Error("spotdl not found");
}

export async function startSpotifyDownload(userId: number, url: string) {
    if (activeDownloads.get(userId)) {
        throw new Error("Download already in progress for this user");
    }

    // Detect spotdl command once
    let foundCmd: { cmd: string; mode: "exe" | "module" };
    try {
        foundCmd = findSpotdlCommand();
    } catch (err) {
        throw new Error("spotdl not available on server");
    }
    activeDownloads.set(userId, true);
    const uploadsDir = path.join(process.cwd(), "uploads");
    const userDir = path.join(uploadsDir, String(userId));
    if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
    }

    let cmd: string;
    let args: string[];
    if (foundCmd.mode === "exe") {
        cmd = foundCmd.cmd;
        args = ["download", url, "--output", userDir, "--log-level", "DEBUG", "--print-errors"];
    } else {
        cmd = foundCmd.cmd;
        args = ["-m", "spotdl", "download", url, "--output", userDir, "--log-level", "DEBUG", "--print-errors"];
    }

    const proc = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });

    proc.on("error", (err) => {
        spotifyEmitter.emit("error", { userId, error: String(err) });
    });

    const regex = /Downloading\s+(\d+)\/(\d+):\s+(.+)/i;

    // emit initial processing status
    spotifyEmitter.emit("progress", { userId, status: "processing", progress: 0 });

    proc.stdout.on("data", (chunk) => {
        const lines = String(chunk).split(/\r?\n/).filter(Boolean);
        for (const line of lines) {
            const m = regex.exec(line);
            if (m) {
                const current = parseInt(m[1], 10);
                const total = parseInt(m[2], 10);
                const name = m[3].trim();
                const progress = total > 0 ? Math.round((current / total) * 100) : 0;
                spotifyEmitter.emit("progress", {
                    userId,
                    status: "downloading",
                    progress,
                    currentTrack: name,
                    totalTracks: total,
                });
            } else {
                // generic progress line
                const low = line.toLowerCase();
                if (low.includes("rate") && low.includes("limit")) {
                    spotifyEmitter.emit("error", { userId, status: "error", error: line });
                } else {
                    spotifyEmitter.emit("log", { userId, line });
                }
            }
        }
    });

    proc.stderr.on("data", (chunk) => {
        const text = String(chunk).trim();
        if (text) {
            spotifyEmitter.emit("error", { userId, status: "error", error: text });
        }
    });

    proc.on("close", async (code) => {
        try {
            // Scan user directory for audio files and create track records
            const existing = await storage.getTracksByUser(userId);
            const existingFilenames = new Set(existing.map((t) => t.filename));

            const files = fs.existsSync(userDir)
                ? fs.readdirSync(userDir)
                : [];

            const createdTracks: any[] = [];

            for (const file of files) {
                const ext = path.extname(file).toLowerCase();
                if (![".mp3", ".wav", ".flac", ".m4a"].includes(ext)) continue;
                if (existingFilenames.has(file)) continue;

                const fullPath = path.join(userDir, file);
                try {
                    const meta = await extractMetadata(fullPath, file);
                    const stat = fs.statSync(fullPath);
                    const mimeType = ext === ".mp3" ? "audio/mpeg" : "audio/wav";

                    const trackData = {
                        title: meta.title || path.parse(file).name,
                        artist: meta.artist || "Unknown Artist",
                        album: meta.album || null,
                        trackNumber: meta.trackNumber ?? null,
                        coverArt: meta.coverArtPath ?? null,
                        duration: meta.duration || 0,
                        filename: file,
                        filePath: fullPath,
                        mimeType,
                        fileSize: stat.size,
                    };

                    const created = await storage.createTrack({
                        ...trackData,
                        userId,
                    } as any);
                    createdTracks.push(created);
                } catch (err) {
                    spotifyEmitter.emit("error", { userId, status: "error", error: String(err) });
                }
            }

            spotifyEmitter.emit("complete", {
                userId,
                status: code === 0 ? "complete" : "error",
                createdTracks,
            });
        } catch (err) {
            spotifyEmitter.emit("error", { userId, status: "error", error: String(err) });
        }
        finally {
            activeDownloads.delete(userId);
        }
    });

    return proc;
}
