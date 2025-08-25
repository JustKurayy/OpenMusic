import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    MoreHorizontal,
    Play,
    Edit2,
    Trash2,
    Heart,
    Download,
    Share,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { playlistsApi, type ApiPlaylistWithTracks } from "@/lib/api";
import { usePlayer } from "@/contexts/PlayerContext";
import TrackList from "@/components/TrackList";

export default function Playlist() {
    const { id } = useParams<{ id: string }>();
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [dominantColor, setDominantColor] = useState("rgb(83, 83, 83)");
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { playTrack } = usePlayer();

    const { data: playlist, isLoading } = useQuery<ApiPlaylistWithTracks>({
        queryKey: ["/api/playlists", id],
        enabled: !!id && id !== "new",
    });

    // Extract dominant color from playlist cover
    useEffect(() => {
        if (playlist?.coverImage) {
            const img = new window.Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                try {
                    const canvas = document.createElement("canvas");
                    canvas.width = img.naturalWidth || img.width;
                    canvas.height = img.naturalHeight || img.height;
                    const ctx = canvas.getContext("2d");
                    if (!ctx) throw new Error("No canvas context");
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const imageData = ctx.getImageData(
                        0,
                        0,
                        canvas.width,
                        canvas.height
                    );
                    const data = imageData.data;
                    // Sample pixels and find the most vibrant color
                    let maxSaturation = 0;
                    let mostVibrantColor = { r: 83, g: 83, b: 83 };

                    for (let i = 0; i < data.length; i += 20) {
                        const pixelR = data[i];
                        const pixelG = data[i + 1];
                        const pixelB = data[i + 2];

                        // Calculate saturation (simplified)
                        const max = Math.max(pixelR, pixelG, pixelB);
                        const min = Math.min(pixelR, pixelG, pixelB);
                        const saturation = max - min;

                        if (saturation > maxSaturation && max > 50) {
                            // Avoid very dark colors
                            maxSaturation = saturation;
                            mostVibrantColor = {
                                r: pixelR,
                                g: pixelG,
                                b: pixelB,
                            };
                        }
                    }

                    // Boost vibrancy for more prominent colors
                    const boost = 1.3;
                    const finalR = Math.min(
                        255,
                        Math.floor(mostVibrantColor.r * boost)
                    );
                    const finalG = Math.min(
                        255,
                        Math.floor(mostVibrantColor.g * boost)
                    );
                    const finalB = Math.min(
                        255,
                        Math.floor(mostVibrantColor.b * boost)
                    );

                    setDominantColor(`rgb(${finalR}, ${finalG}, ${finalB})`);
                } catch (e) {
                    setDominantColor("rgb(83, 83, 83)");
                }
            };
            img.onerror = () => setDominantColor("rgb(83, 83, 83)");
            img.src =
                playlist.coverImage +
                (playlist.coverImage.indexOf("?") === -1 ? "?" : "&") +
                "cachebust=" +
                Date.now();
        } else {
            setDominantColor("rgb(83, 83, 83)");
        }
    }, [playlist?.coverImage]);

    const updateMutation = useMutation({
        mutationFn: (data: { name: string; description: string }) =>
            playlistsApi.update(parseInt(id!), data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
            queryClient.invalidateQueries({ queryKey: ["/api/playlists", id] });
            setIsEditing(false);
            toast({
                title: "Success",
                description: "Playlist updated successfully!",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () => playlistsApi.delete(parseInt(id!)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
            window.location.href = "/library";
            toast({
                title: "Success",
                description: "Playlist deleted successfully!",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const handleEdit = () => {
        if (playlist) {
            setEditName(playlist.name);
            setEditDescription(playlist.description || "");
            setIsEditing(true);
        }
    };

    const handleSave = () => {
        if (editName.trim()) {
            updateMutation.mutate({
                name: editName.trim(),
                description: editDescription.trim(),
            });
        }
    };

    const handlePlayPlaylist = () => {
        if (playlist && playlist.tracks.length > 0) {
            const tracks = playlist.tracks.map((pt) => pt.track);
            playTrack(tracks[0], tracks);
        }
    };

    if (id === "new") {
        window.location.href = "/create-playlist";
        return null;
    }

    if (isLoading) {
        return (
            <div className="flex-1 overflow-y-auto">
                <div className="h-[340px] bg-gradient-to-b from-gray-700 to-gray-900 animate-pulse">
                    <div className="p-6 pt-16">
                        <div className="flex items-end space-x-6">
                            <div className="w-60 h-60 bg-gray-600 rounded shadow-2xl"></div>
                            <div className="flex-1 space-y-4">
                                <div className="h-4 bg-gray-600 rounded w-20"></div>
                                <div className="h-12 bg-gray-600 rounded w-96"></div>
                                <div className="h-4 bg-gray-600 rounded w-64"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-6 space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-14 bg-gray-800 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (!playlist) {
        return (
            <div className="flex-1 overflow-y-auto">
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold mb-2 text-white">
                        Playlist not found
                    </h2>
                    <p className="text-gray-400">
                        The playlist you're looking for doesn't exist or you
                        don't have access to it.
                    </p>
                </div>
            </div>
        );
    }

    const tracks = playlist.tracks.map((pt) => pt.track);
    const hasCoverImage = !!playlist.coverImage;

    return (
        <div className="min-h-screen flex flex-col bg-black">
            {/* Dynamic Header with Gradient */}
            <div
                className="relative h-[340px] overflow-hidden"
                style={{
                    background: hasCoverImage
                        ? `linear-gradient(0deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.2) 70%, transparent 100%), linear-gradient(180deg, ${dominantColor} 0%, ${dominantColor}40 50%, #121212 100%)`
                        : "linear-gradient(180deg, #a4508b 0%, #5f0a87 100%)",
                }}
            >
                {/* Enhanced overlay for better contrast and color prominence */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: hasCoverImage
                            ? `linear-gradient(135deg, ${dominantColor}20 0%, transparent 50%, ${dominantColor}10 100%)`
                            : "transparent",
                    }}
                />
                <div className="relative px-8 pt-20 pb-6 h-full flex items-end space-x-6">
                    {/* Playlist Cover */}
                    <div className="w-56 h-56 flex-shrink-0 shadow-2xl rounded-md">
                        {hasCoverImage ? (
                            <img
                                src={playlist.coverImage}
                                alt={playlist.name}
                                className="w-full h-full object-cover rounded-md shadow-2xl"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-md flex items-center justify-center shadow-2xl">
                                <div className="text-7xl text-white opacity-80">
                                    ♪
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Playlist Info */}
                    <div className="flex-1 min-w-0 pb-2">
                        <p className="text-sm font-medium text-white mb-2 tracking-wide uppercase">
                            Public Playlist
                        </p>
                        {isEditing ? (
                            <div className="space-y-4">
                                <Input
                                    value={editName}
                                    onChange={(e) =>
                                        setEditName(e.target.value)
                                    }
                                    className="text-7xl font-black bg-transparent border-none p-0 text-white placeholder-gray-400 focus:ring-0"
                                    style={{
                                        fontSize: "6rem",
                                        lineHeight: "1",
                                        fontWeight: "900",
                                    }}
                                />
                                <Input
                                    value={editDescription}
                                    onChange={(e) =>
                                        setEditDescription(e.target.value)
                                    }
                                    className="text-lg text-gray-300 bg-transparent border-none p-0 placeholder-gray-500 focus:ring-0"
                                    placeholder="Add a description"
                                />
                                <div className="flex space-x-3 pt-4">
                                    <Button
                                        size="sm"
                                        onClick={handleSave}
                                        disabled={updateMutation.isPending}
                                        className="bg-white text-black hover:bg-gray-200 font-medium px-6"
                                    >
                                        Save
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setIsEditing(false)}
                                        className="border-gray-500 text-white hover:bg-gray-800"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h1
                                    className="text-8xl font-black mb-4 text-white leading-none break-words"
                                    style={{ fontWeight: "900" }}
                                >
                                    {playlist.name}
                                </h1>
                                {playlist.description && (
                                    <p className="text-lg text-gray-300 mb-4 leading-relaxed">
                                        {playlist.description}
                                    </p>
                                )}
                                <div className="flex items-center space-x-1 text-sm text-white">
                                    <span className="font-medium">
                                        {playlist.user?.name || "Unknown User"}
                                    </span>
                                    <span className="text-white mx-2">•</span>
                                    <span className="text-white">
                                        {playlist.trackCount || 0} songs
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="px-8 py-6 bg-gradient-to-b from-black/60 to-black">
                <div className="flex items-center space-x-8">
                    <Button
                        size="lg"
                        className="w-14 h-14 bg-green-500 hover:bg-green-400 hover:scale-105 text-black rounded-full transition-all duration-200 shadow-lg"
                        onClick={handlePlayPlaylist}
                        disabled={tracks.length === 0}
                    >
                        <Play className="w-5 h-5 ml-0.5 fill-current" />
                    </Button>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="lg"
                                className="w-8 h-8 text-gray-400 hover:text-white p-0 hover:scale-110 transition-all duration-200"
                            >
                                <MoreHorizontal className="w-8 h-8" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-800 border-gray-700">
                            <DialogHeader>
                                <DialogTitle className="text-white">
                                    Playlist Options
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-1">
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-white hover:text-green-400 hover:bg-gray-700 h-12"
                                    onClick={handleEdit}
                                >
                                    <Edit2 className="w-4 h-4 mr-3" />
                                    Edit Details
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-white hover:text-green-400 hover:bg-gray-700 h-12"
                                >
                                    <Share className="w-4 h-4 mr-3" />
                                    Share
                                </Button>
                                <hr className="border-gray-700 my-2" />
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-gray-700 h-12"
                                    onClick={() => deleteMutation.mutate()}
                                    disabled={deleteMutation.isPending}
                                >
                                    <Trash2 className="w-4 h-4 mr-3" />
                                    Delete Playlist
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Track List */}
            <div className="bg-black px-8 pb-6 flex-1">
                {tracks.length === 0 ? (
                    <div className="text-center py-16">
                        <h3 className="text-2xl font-bold mb-4 text-white">
                            Start by searching for songs and artists
                        </h3>
                        <p className="text-gray-400 mb-8 text-lg">
                            They'll show up here once you add them.
                        </p>
                        <Button className="bg-white text-black hover:bg-gray-200 font-semibold px-8 py-3 rounded-full text-sm">
                            Find something to play
                        </Button>
                    </div>
                ) : (
                    <TrackList
                        tracks={tracks}
                        showAlbum={true}
                        showDateAdded={false}
                    />
                )}
            </div>
        </div>
    );
}
