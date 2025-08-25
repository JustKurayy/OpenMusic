import multer from "multer";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import { parseFile } from "music-metadata";

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const userDir = path.join(
            uploadsDir,
            req.user?.id?.toString() || "anonymous"
        );

        try {
            await mkdir(userDir, { recursive: true });
            cb(null, userDir);
        } catch (error) {
            cb(error, "");
        }
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    },
});

// File filter for audio files
const fileFilter = (
    req: any,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    const allowedMimes = ["audio/mpeg", "audio/wav", "audio/mp3"];
    const allowedExts = [".mp3", ".wav"];

    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error("Only .mp3 and .wav files are allowed"));
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    },
});

// Extract metadata from audio file
export async function extractMetadata(filePath: string, originalName: string) {
    try {
        const metadata = await parseFile(filePath);

        return {
            title: metadata.common.title || path.parse(originalName).name,
            artist: metadata.common.artist || "Unknown Artist",
            album: metadata.common.album || "Unknown Album",
            duration: metadata.format.duration || 0,
        };
    } catch (error) {
        console.error("Error extracting metadata:", error);

        // Fallback to filename parsing
        const nameWithoutExt = path.parse(originalName).name;
        const parts = nameWithoutExt.split(" - ");

        return {
            title: parts.length > 1 ? parts[1] : nameWithoutExt,
            artist: parts.length > 1 ? parts[0] : "Unknown Artist",
            album: "Unknown Album",
            duration: 0,
        };
    }
}

// Stream audio file
export function streamAudio(filePath: string, req: any, res: any) {
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        // Handle range requests for seeking
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = end - start + 1;

        const file = fs.createReadStream(filePath, { start, end });
        const head = {
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": chunksize,
            "Content-Type": "audio/mpeg",
        };

        res.writeHead(206, head);
        file.pipe(res);
    } else {
        // Stream entire file
        const head = {
            "Content-Length": fileSize,
            "Content-Type": "audio/mpeg",
        };

        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);
    }
}
