import { useMemo } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Play, Music, Disc3, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/contexts/PlayerContext";
import { useAuth } from "@/contexts/AuthContext";
import { tracksApi, type ApiTrack } from "@/lib/api";
import TrackList from "@/components/TrackList";
import { motion } from "framer-motion";

function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h} hr ${m} min`;
    return `${m} min`;
}

export default function Album() {
    const { albumName: encodedAlbumName } = useParams<{ albumName: string }>();
    const albumName = decodeURIComponent(encodedAlbumName || "");
    const { user } = useAuth();
    const { playTrack, currentTrack } = usePlayer();

    const { data: allTracks = [], isLoading } = useQuery<ApiTrack[]>({
        queryKey: ["/api/tracks"],
        enabled: !!user,
    });

    const albumTracks = useMemo(
        () =>
            allTracks
                .filter((t) => t.album === albumName)
                .sort(
                    (a, b) => (a.trackNumber ?? 999) - (b.trackNumber ?? 999)
                ),
        [allTracks, albumName]
    );

    const coverTrack = albumTracks.find((t) => t.coverArt);
    const coverArtUrl = coverTrack
        ? tracksApi.getArtworkUrl(coverTrack.id)
        : undefined;

    const artist =
        albumTracks.length > 0 ? albumTracks[0].artist : "Unknown Artist";
    const totalDuration = albumTracks.reduce(
        (s, t) => s + (t.duration ?? 0),
        0
    );

    const handlePlay = () => {
        if (albumTracks.length > 0) {
            playTrack(albumTracks[0], albumTracks);
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 overflow-y-auto">
                <div className="h-[340px] bg-gradient-to-b from-zinc-700 to-zinc-900 animate-pulse" />
                <div className="px-6 py-6 space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-14 bg-zinc-800 rounded" />
                    ))}
                </div>
            </div>
        );
    }

    if (albumTracks.length === 0) {
        return (
            <div className="flex-1 overflow-y-auto p-8 text-center">
                <Disc3 className="w-16 h-16 text-zinc-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">
                    Album not found
                </h2>
                <p className="text-zinc-400">
                    No tracks found for "{albumName}".
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col rounded-lg bg-[var(--spotify-panel)]">
            {/* Header */}
            <div
                className="relative overflow-hidden bg-gradient-to-b from-[var(--spotify-panel)] to-zinc-900 border-b border-gray-800"
                style={{ minHeight: 320 }}
            >
                <motion.div
                    className="relative px-8 pt-16 pb-6 flex items-end gap-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.6,
                        delay: 0.2,
                        ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                >
                    {/* Cover art */}
                    <motion.div
                        className="w-52 h-52 flex-shrink-0 rounded-md shadow-lg overflow-hidden"
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
                        {coverArtUrl ? (
                            <motion.img
                                src={coverArtUrl}
                                alt={albumName}
                                className="w-full h-full object-cover"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{
                                    duration: 0.4,
                                    delay: 0.3,
                                }}
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{
                                        duration: 0.4,
                                        delay: 0.4,
                                        ease: [0.25, 0.46, 0.45, 0.94],
                                    }}
                                >
                                    <Disc3 className="w-20 h-20 text-gray-600" />
                                </motion.div>
                            </div>
                        )}
                    </motion.div>

                    {/* Meta */}
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
                            className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{
                                duration: 0.3,
                                delay: 0.3,
                            }}
                        >
                            Album
                        </motion.p>
                        <motion.h1
                            className="text-5xl font-bold text-white mb-3 break-words"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.5,
                                delay: 0.25,
                                ease: [0.25, 0.46, 0.45, 0.94],
                            }}
                        >
                            {albumName}
                        </motion.h1>
                        <motion.p
                            className="text-sm text-gray-400"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.4,
                                delay: 0.3,
                                ease: [0.25, 0.46, 0.45, 0.94],
                            }}
                        >
                            <motion.span
                                className="font-semibold text-white"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{
                                    duration: 0.3,
                                    delay: 0.35,
                                }}
                            >
                                {artist}
                            </motion.span>
                            <motion.span
                                className="mx-2"
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
                                {albumTracks.length} songs
                            </motion.span>
                            <motion.span
                                className="mx-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{
                                    duration: 0.2,
                                    delay: 0.45,
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
                                {formatDuration(totalDuration)}
                            </motion.span>
                        </motion.p>
                    </motion.div>
                </motion.div>
            </div>

            {/* Controls */}
            <div className="px-8 py-4 border-b border-gray-800 flex items-center gap-4">
                <Button
                    size="lg"
                    className="w-12 h-12 bg-green-500 hover:bg-green-400 text-black rounded-full transition-colors duration-200"
                    onClick={handlePlay}
                >
                    <Play className="w-5 h-5 ml-0.5 fill-current" />
                </Button>
            </div>

            {/* Track list */}
            <div className="bg-[var(--spotify-panel)] px-8 pb-8 flex-1">
                {/* Column headers */}
                <div className="grid grid-cols-[16px_1fr_minmax(80px,auto)] gap-4 px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-800 mb-2 uppercase tracking-wider">
                    <span>#</span>
                    <span>Title</span>
                    <Clock className="w-3.5 h-3.5 justify-self-end" />
                </div>
                <TrackList
                    tracks={albumTracks}
                    showHeader={false}
                    showAlbum={false}
                    containerId="album-tracks"
                />
            </div>
        </div>
    );
}
