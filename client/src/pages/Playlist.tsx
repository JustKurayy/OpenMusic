import { useState } from "react";
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
import { motion } from "framer-motion";
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
    const [editCoverImage, setEditCoverImage] = useState("");
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { playTrack } = usePlayer();

    const { data: playlist, isLoading } = useQuery<ApiPlaylistWithTracks>({
        queryKey: ["/api/playlists", id],
        enabled: !!id && id !== "new",
    });

    const updateMutation = useMutation({
        mutationFn: (data: {
            name: string;
            description?: string;
            coverImage?: string | null;
        }) => playlistsApi.update(parseInt(id!), data),
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
            setEditCoverImage(playlist.coverImage || "");
            setIsEditing(true);
        }
    };

    const handleSave = () => {
        if (editName.trim()) {
            updateMutation.mutate({
                name: editName.trim(),
                description: editDescription.trim() || undefined,
                coverImage: editCoverImage.trim() || null,
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

    return (
        <div className="min-h-screen flex flex-col rounded-lg bg-[var(--spotify-panel)]">
            {/* Header */}
            <motion.div
                className="relative bg-gradient-to-b from-[var(--spotify-panel)] to-zinc-900 h-[340px] border-b border-gray-800"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.6,
                    delay: 0.2,
                    ease: [0.25, 0.46, 0.45, 0.94],
                }}
            >
                <div className="relative px-8 pt-20 pb-6 h-full flex items-end space-x-6">
                    {/* Cover Art */}
                    <motion.div
                        className="w-56 h-56 flex-shrink-0 rounded-md shadow-lg"
                        initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{
                            duration: 0.6,
                            ease: [0.25, 0.46, 0.45, 0.94],
                            delay: 0.1,
                        }}
                        whileHover={{
                            scale: 1.05,
                            rotate: 2,
                            transition: { duration: 0.3 },
                        }}
                    >
                        {playlist.coverImage ? (
                            <img
                                src={playlist.coverImage}
                                alt={playlist.name}
                                className="w-full h-full object-cover rounded-md"
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-800 rounded-md flex items-center justify-center">
                                <div className="text-7xl text-gray-600">♪</div>
                            </div>
                        )}
                    </motion.div>

                    {/* Playlist Info */}
                    <motion.div
                        className="flex-1 min-w-0 pb-2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                            duration: 0.5,
                            delay: 0.2,
                            ease: [0.25, 0.46, 0.45, 0.94],
                        }}
                    >
                        <motion.p
                            className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{
                                duration: 0.3,
                                delay: 0.3,
                            }}
                        >
                            Playlist
                        </motion.p>

                        {isEditing ? (
                            <div className="space-y-4">
                                <Input
                                    value={editName}
                                    onChange={(e) =>
                                        setEditName(e.target.value)
                                    }
                                    className="text-5xl font-bold bg-transparent border-none p-0 text-white placeholder-gray-500 focus:ring-0"
                                />
                                <Input
                                    value={editDescription}
                                    onChange={(e) =>
                                        setEditDescription(e.target.value)
                                    }
                                    className="text-sm text-gray-400 bg-transparent border-none p-0 placeholder-gray-600 focus:ring-0"
                                    placeholder="Add a description"
                                />
                                <Input
                                    value={editCoverImage}
                                    onChange={(e) =>
                                        setEditCoverImage(e.target.value)
                                    }
                                    className="text-xs text-gray-400 bg-transparent border-none p-0 placeholder-gray-600 focus:ring-0"
                                    placeholder="Cover image URL"
                                />
                                <div className="flex space-x-3 pt-4">
                                    <Button
                                        size="sm"
                                        onClick={handleSave}
                                        disabled={updateMutation.isPending}
                                        className="bg-green-500 text-black hover:bg-green-400 font-medium px-6"
                                    >
                                        Save
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setIsEditing(false)}
                                        className="border-gray-600 text-white hover:bg-gray-800"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <motion.h1
                                    className="text-5xl font-bold mb-3 text-white break-words"
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        duration: 0.5,
                                        delay: 0.25,
                                        ease: [0.25, 0.46, 0.45, 0.94],
                                    }}
                                >
                                    {playlist.name}
                                </motion.h1>
                                {playlist.description && (
                                    <motion.p
                                        className="text-sm text-gray-400 mb-4"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            duration: 0.4,
                                            delay: 0.3,
                                            ease: [0.25, 0.46, 0.45, 0.94],
                                        }}
                                    >
                                        {playlist.description}
                                    </motion.p>
                                )}
                                <motion.div
                                    className="flex items-center space-x-2 text-xs text-gray-400"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        duration: 0.4,
                                        delay: 0.3,
                                        ease: [0.25, 0.46, 0.45, 0.94],
                                    }}
                                >
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{
                                            duration: 0.3,
                                            delay: 0.35,
                                        }}
                                    >
                                        {playlist.user?.name || "Unknown"}
                                    </motion.span>
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{
                                            duration: 0.2,
                                            delay: 0.4,
                                        }}
                                    >
                                        •
                                    </motion.span>
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{
                                            duration: 0.3,
                                            delay: 0.35,
                                        }}
                                    >
                                        {playlist.trackCount || 0} songs
                                    </motion.span>
                                </motion.div>
                            </>
                        )}
                    </motion.div>
                </div>
            </motion.div>

            {/* Controls */}
            <div className="px-8 py-4 border-b border-gray-800 flex items-center space-x-4">
                <Button
                    size="lg"
                    className="w-12 h-12 bg-green-500 hover:bg-green-400 text-black rounded-full transition-colors duration-200"
                    onClick={handlePlayPlaylist}
                    disabled={tracks.length === 0}
                >
                    <Play className="w-5 h-5 ml-0.5 fill-current" />
                </Button>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-8 h-8 text-gray-400 hover:text-white p-0 transition-colors duration-200"
                        >
                            <MoreHorizontal className="w-5 h-5" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-gray-700">
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

            {/* Track List */}
            <div className="bg-[var(--spotify-panel)] px-8 pb-6 flex-1">
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
