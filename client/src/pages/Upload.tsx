import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
    CloudUpload,
    X,
    Music,
    Users,
    ExternalLink,
    Loader2,
    ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { tracksApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface UploadFile {
    file: File;
    title: string;
    artist: string;
    album: string;
    trackNumber?: number;
    coverArtPreview?: string; // data URL for preview
    isLoadingMetadata: boolean;
}

export default function Upload() {
    const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const isGuest = user && (user as any).isGuest;

    const uploadMutation = useMutation({
        mutationFn: async (uploadFile: UploadFile) => {
            const formData = new FormData();
            formData.append("audio", uploadFile.file);
            formData.append("title", uploadFile.title);
            formData.append("artist", uploadFile.artist);
            formData.append("album", uploadFile.album);
            if (uploadFile.trackNumber != null) {
                formData.append("trackNumber", String(uploadFile.trackNumber));
            }

            const response = await tracksApi.upload(formData);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Upload failed");
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/tracks"] });
            toast({ title: "Success", description: "Track uploaded successfully!" });
        },
        onError: (error: Error) => {
            toast({
                title: "Upload failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        handleFiles(Array.from(e.dataTransfer.files));
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) handleFiles(Array.from(e.target.files));
    };

    const handleFiles = async (files: File[]) => {
        const audioFiles = files.filter(
            (f) =>
                f.type.includes("audio") ||
                f.name.toLowerCase().endsWith(".mp3") ||
                f.name.toLowerCase().endsWith(".wav")
        );
        if (audioFiles.length === 0) return;

        // Add placeholder entries in loading state
        const startIdx = uploadFiles.length;
        const loadingEntries: UploadFile[] = audioFiles.map((file) => ({
            file,
            title: "",
            artist: "",
            album: "",
            isLoadingMetadata: true,
        }));
        setUploadFiles((prev) => [...prev, ...loadingEntries]);

        // Extract metadata for each file via the server
        for (let i = 0; i < audioFiles.length; i++) {
            try {
                const formData = new FormData();
                formData.append("audio", audioFiles[i]);
                const res = await tracksApi.extractMetadata(formData);
                if (res.ok) {
                    const meta = await res.json();
                    setUploadFiles((prev) =>
                        prev.map((f, idx) =>
                            idx === startIdx + i
                                ? {
                                      ...f,
                                      title: meta.title ?? f.file.name.replace(/\.[^/.]+$/, ""),
                                      artist: meta.artist ?? "",
                                      album: meta.album ?? "",
                                      trackNumber: meta.trackNumber,
                                      coverArtPreview: meta.coverArtDataUrl,
                                      isLoadingMetadata: false,
                                  }
                                : f
                        )
                    );
                } else {
                    throw new Error("Metadata extraction failed");
                }
            } catch {
                // Fallback to filename parsing
                const nameWithoutExt = audioFiles[i].name.replace(/\.[^/.]+$/, "");
                const parts = nameWithoutExt.split(" - ");
                setUploadFiles((prev) =>
                    prev.map((f, idx) =>
                        idx === startIdx + i
                            ? {
                                  ...f,
                                  title: parts.length > 1 ? parts[1] : nameWithoutExt,
                                  artist: parts.length > 1 ? parts[0] : "",
                                  album: "",
                                  isLoadingMetadata: false,
                              }
                            : f
                    )
                );
            }
        }
    };

    const updateField = (
        index: number,
        field: keyof Omit<UploadFile, "file" | "isLoadingMetadata" | "coverArtPreview">,
        value: string | number
    ) => {
        setUploadFiles((prev) =>
            prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
        );
    };

    const removeFile = (index: number) => {
        setUploadFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleUploadAll = async () => {
        for (const uploadFile of uploadFiles) {
            if (!uploadFile.title.trim()) {
                toast({
                    title: "Validation error",
                    description: "Please provide a title for all tracks",
                    variant: "destructive",
                });
                return;
            }
            try {
                await uploadMutation.mutateAsync(uploadFile);
            } catch {
                break;
            }
        }
        if (!uploadMutation.isError) {
            setUploadFiles([]);
        }
    };

    if (isGuest) {
        return (
            <div className="flex-1 overflow-y-auto p-6">
                <h1 className="text-3xl font-bold mb-6 text-white">Upload Your Music</h1>
                <Card className="mb-8 bg-zinc-900 border-zinc-800">
                    <CardContent className="p-8 text-center">
                        <Users className="mx-auto mb-4 w-16 h-16 text-zinc-500" />
                        <h3 className="text-xl font-semibold mb-4 text-white">
                            Upload Not Available in Guest Mode
                        </h3>
                        <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                            Sign in with Google to upload and manage your own music.
                        </p>
                        <Button
                            onClick={() => (window.location.href = "/api/auth/google")}
                            className="bg-green-500 hover:bg-green-400 text-black font-semibold"
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Sign in with Google
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <motion.div
            className="flex-1 overflow-y-auto p-6 min-h-screen bg-zinc-950"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <h1 className="text-3xl font-bold mb-6 text-white">Upload Your Music</h1>

            {/* Drop zone */}
            <Card className="mb-8 bg-zinc-900 border-zinc-800">
                <CardContent className="p-8">
                    <div
                        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
                            isDragOver
                                ? "border-green-500 bg-green-500/10"
                                : "border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/40"
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <CloudUpload
                            className={`mx-auto mb-4 w-12 h-12 transition-colors duration-200 ${
                                isDragOver ? "text-green-400" : "text-zinc-500"
                            }`}
                        />
                        <h3
                            className={`text-lg font-semibold mb-2 ${
                                isDragOver ? "text-green-400" : "text-white"
                            }`}
                        >
                            Drop your tracks here
                        </h3>
                        <p className="text-zinc-500 mb-5 text-sm">
                            Drag and drop .mp3 or .wav files — cover art and tags are read
                            automatically
                        </p>
                        <Button className="bg-green-500 hover:bg-green-400 text-black font-semibold">
                            Choose Files
                        </Button>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".mp3,.wav,audio/*"
                        onChange={handleFileInput}
                        className="hidden"
                    />
                </CardContent>
            </Card>

            {/* Upload queue */}
            <AnimatePresence>
                {uploadFiles.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-white">
                                Ready to Upload ({uploadFiles.length})
                            </h2>
                            <Button
                                onClick={handleUploadAll}
                                disabled={
                                    uploadMutation.isPending ||
                                    uploadFiles.some((f) => f.isLoadingMetadata)
                                }
                                className="bg-green-500 hover:bg-green-400 text-black font-semibold"
                            >
                                {uploadMutation.isPending ? "Uploading…" : "Upload All"}
                            </Button>
                        </div>

                        {uploadFiles.map((uploadFile, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.04 }}
                            >
                                <Card className="bg-zinc-900 border-zinc-800">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4 min-w-0">
                                                {/* Cover art preview or loading */}
                                                <div className="w-14 h-14 rounded-md flex-shrink-0 overflow-hidden bg-zinc-800 flex items-center justify-center">
                                                    {uploadFile.isLoadingMetadata ? (
                                                        <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
                                                    ) : uploadFile.coverArtPreview ? (
                                                        <img
                                                            src={uploadFile.coverArtPreview}
                                                            alt="cover"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Music className="w-6 h-6 text-green-500" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <CardTitle className="text-white text-sm truncate">
                                                        {uploadFile.file.name}
                                                    </CardTitle>
                                                    <p className="text-xs text-zinc-500 mt-0.5">
                                                        {(uploadFile.file.size / (1024 * 1024)).toFixed(2)} MB
                                                        {uploadFile.isLoadingMetadata && (
                                                            <span className="ml-2 text-zinc-600">
                                                                Reading tags…
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeFile(index)}
                                                className="text-zinc-500 hover:text-white flex-shrink-0"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>

                                    <CardContent>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                            <div>
                                                <Label className="text-zinc-400 text-xs mb-1 block">
                                                    Title *
                                                </Label>
                                                <Input
                                                    value={uploadFile.title}
                                                    onChange={(e) =>
                                                        updateField(index, "title", e.target.value)
                                                    }
                                                    disabled={uploadFile.isLoadingMetadata}
                                                    className="bg-zinc-800 border-zinc-700 text-white text-sm"
                                                    placeholder="Track title"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-zinc-400 text-xs mb-1 block">
                                                    Artist
                                                </Label>
                                                <Input
                                                    value={uploadFile.artist}
                                                    onChange={(e) =>
                                                        updateField(index, "artist", e.target.value)
                                                    }
                                                    disabled={uploadFile.isLoadingMetadata}
                                                    className="bg-zinc-800 border-zinc-700 text-white text-sm"
                                                    placeholder="Artist name"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-zinc-400 text-xs mb-1 block">
                                                    Album
                                                </Label>
                                                <Input
                                                    value={uploadFile.album}
                                                    onChange={(e) =>
                                                        updateField(index, "album", e.target.value)
                                                    }
                                                    disabled={uploadFile.isLoadingMetadata}
                                                    className="bg-zinc-800 border-zinc-700 text-white text-sm"
                                                    placeholder="Album name"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-zinc-400 text-xs mb-1 block">
                                                    Track #
                                                </Label>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    value={uploadFile.trackNumber ?? ""}
                                                    onChange={(e) =>
                                                        updateField(
                                                            index,
                                                            "trackNumber",
                                                            parseInt(e.target.value) || 0
                                                        )
                                                    }
                                                    disabled={uploadFile.isLoadingMetadata}
                                                    className="bg-zinc-800 border-zinc-700 text-white text-sm"
                                                    placeholder="1"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
