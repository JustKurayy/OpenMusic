"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getCountryCode } from "@/lib/getCountryCode";
import { getStationsByCountry } from "@/lib/radioBrowserApi";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { useQuery } from "@tanstack/react-query";
import { tracksApi, type ApiTrack } from "@/lib/api";
import { playlistsApi, type ApiPlaylist } from "@/lib/api";
import { historyApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayer } from "@/contexts/PlayerContext";
import {
    Play,
    Clock,
    Heart,
    Music,
    TrendingUp,
    Star,
    Users,
    Mic2,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    Upload,
    Radio,
    ListMusic,
    Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface BentoGridProps {
    tracks: ApiTrack[];
    onTrackClick: (track: ApiTrack) => void;
}

export default function BentoGrid({ tracks, onTrackClick }: BentoGridProps) {
    // Refs for scrollable lists
    const recentTracksRef = useRef<HTMLDivElement>(null);
    const playlistsRef = useRef<HTMLDivElement>(null);
    const radiosRef = useRef<HTMLDivElement>(null);
    const recentlyPlayedRef = useRef<HTMLDivElement>(null);

    // Fetch user's playlists, user, and listening history
    const { user } = useAuth();
    const { data: userPlaylists = [] } = useQuery<ApiPlaylist[]>({
        queryKey: ["/api/playlists"],
        enabled: !!user,
    });
    const userPlaylistsLimited: ApiPlaylist[] = userPlaylists.slice(0, 8);
    const recentTracks: ApiTrack[] = tracks.slice(0, 8);

    // Fetch recent plays from listening history using historyApi
    const { data: recentPlays = [], isLoading: isLoadingRecentPlays } =
        useQuery<any[]>({
            queryKey: ["history/replay"],
            enabled: true, // Always enabled, but only fetch if user exists
            queryFn: async () => {
                if (!user) return []; // Return empty array if no user
                return historyApi.getRecentPlays(16).then((res) => res.json());
            },
        });

    // Use the tracks prop passed from parent component (already contains all tracks)
    const tracksData = tracks || [];

    // Only render recently played when data is loaded and user exists
    const renderRecentlyPlayed =
        user && !isLoadingRecentPlays && (recentPlays?.length || 0) > 0;

    // Map history entries to track data and create combined objects with play count
    const recentlyPlayedTracksWithCount: Array<
        ApiTrack & { playCount: number }
    > = (recentPlays ?? [])
        .map((play: any) => {
            const track = tracksData.find((t) => t.id === play.trackId);
            if (track) {
                return { ...track, playCount: play.playCount };
            }
            return null;
        })
        .filter((t: any): t is ApiTrack & { playCount: number } => t !== null);

    // Keep only valid tracks (not undefined)
    const validTracks = recentlyPlayedTracksWithCount.filter(
        (t) => t !== undefined
    );
    const recentlyPlayedTracksFiltered: Array<
        ApiTrack & { playCount: number }
    > = validTracks as Array<ApiTrack & { playCount: number }>;
    const [radios, setRadios] = useState<any[]>([]);

    // State to track scrollability
    const [canScrollRecent, setCanScrollRecent] = useState(false);
    const [canScrollPlaylists, setCanScrollPlaylists] = useState(false);
    const [canScrollRadios, setCanScrollRadios] = useState(false);
    const [canScrollPlayed, setCanScrollPlayed] = useState(false);

    // Check scrollability on mount and window resize
    useEffect(() => {
        function checkScroll() {
            setCanScrollRecent(
                !!recentTracksRef.current &&
                    recentTracksRef.current.scrollWidth >
                        recentTracksRef.current.clientWidth
            );
            setCanScrollPlaylists(
                !!playlistsRef.current &&
                    playlistsRef.current.scrollWidth >
                        playlistsRef.current.clientWidth
            );
            setCanScrollRadios(
                !!radiosRef.current &&
                    radiosRef.current.scrollWidth >
                        radiosRef.current.clientWidth
            );
            setCanScrollPlayed(
                !!recentlyPlayedRef.current &&
                    recentlyPlayedRef.current.scrollWidth >
                        recentlyPlayedRef.current.clientWidth
            );
        }
        checkScroll();
        window.addEventListener("resize", checkScroll);
        return () => window.removeEventListener("resize", checkScroll);
    }, [
        recentTracks.length,
        userPlaylistsLimited.length,
        radios.length,
        recentlyPlayedTracksFiltered.length,
        tracksData.length,
    ]);

    // Scroll handlers
    const scrollLeft = (ref: React.RefObject<HTMLDivElement>) => {
        if (ref.current)
            ref.current.scrollBy({ left: -300, behavior: "smooth" });
    };
    const scrollRight = (ref: React.RefObject<HTMLDivElement>) => {
        if (ref.current)
            ref.current.scrollBy({ left: 300, behavior: "smooth" });
    };
    const { playRadio } = usePlayer();
    const countryCode = getCountryCode();
    const [radiosLoading, setRadiosLoading] = useState(true);
    useEffect(() => {
        setRadiosLoading(true);
        getStationsByCountry(countryCode, 16)
            .then(setRadios)
            .finally(() => setRadiosLoading(false));
    }, [countryCode]);
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        track: any;
    } | null>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);
    const gridRef = useRef<HTMLDivElement>(null);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    return (
        <div
            ref={gridRef}
            className="relative p-6 md:p-8 min-h-screen"
            style={{
                background:
                    "linear-gradient(180deg, #181818 0%, #121212 40%, #0a0a0a 100%)",
            }}
        >
            {/* Ambient gradient orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute w-96 h-96 rounded-full blur-3xl opacity-10"
                    style={{
                        background:
                            "radial-gradient(circle, rgba(34, 197, 94, 0.15) 0%, transparent 70%)",
                        top: "10%",
                        left: "5%",
                    }}
                />
                <div
                    className="absolute w-80 h-80 rounded-full blur-3xl opacity-10"
                    style={{
                        background:
                            "radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)",
                        top: "30%",
                        right: "10%",
                    }}
                />
            </div>

            <div className="relative z-10 space-y-10">
                {/* Greeting */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="pt-4"
                >
                    <h1 className="text-4xl font-bold mb-8">
                        <span className="bg-gradient-to-r from-white via-white to-neutral-400 bg-clip-text text-transparent">
                            {getGreeting()},
                        </span>
                        {user?.name && (
                            <span className="text-green-400 ml-2">
                                {user.name}
                            </span>
                        )}
                    </h1>
                </motion.div>

                {/* Recently Uploaded Section */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.6,
                        delay: 0.1,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-6 bg-gradient-to-b from-green-400 to-green-600 rounded-full" />
                            <h2 className="text-2xl font-semibold text-white">
                                Recently Uploaded
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            {canScrollRecent && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-8 h-8 p-0 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full"
                                    onClick={() => scrollLeft(recentTracksRef)}
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </Button>
                            )}
                            {canScrollRecent && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-8 h-8 p-0 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full"
                                    onClick={() => scrollRight(recentTracksRef)}
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-8 h-8 p-0 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full"
                            >
                                <MoreHorizontal className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Animated slide container */}
                    <div className="relative">
                        {/* Background glow effect */}
                        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-green-500/5 animate-pulse" />
                        </div>

                        <div
                            ref={recentTracksRef}
                            className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide scroll-smooth pl-1"
                        >
                            <AnimatePresence>
                                {recentTracks.map((track, index) => (
                                    <motion.div
                                        key={track.id}
                                        initial={{
                                            opacity: 0,
                                            x: -100,
                                            scale: 0.9,
                                            filter: "blur(10px)",
                                        }}
                                        animate={{
                                            opacity: 1,
                                            x: 0,
                                            scale: 1,
                                            filter: "blur(0px)",
                                        }}
                                        exit={{
                                            opacity: 0,
                                            x: -100,
                                            scale: 0.9,
                                            filter: "blur(10px)",
                                        }}
                                        transition={{
                                            duration: 0.6,
                                            delay: index * 0.03,
                                            ease: "easeOut",
                                        }}
                                        className="flex-shrink-0 w-52 rounded-xl p-4 cursor-pointer group relative bg-[#181818] border border-white/5 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300"
                                        onClick={() => onTrackClick(track)}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            setContextMenu({
                                                x: e.clientX,
                                                y: e.clientY,
                                                track,
                                            });
                                        }}
                                    >
                                        <div className="relative mb-4">
                                            <motion.img
                                                src={
                                                    track.coverArt
                                                        ? tracksApi.getArtworkUrl(
                                                              track.id
                                                          )
                                                        : `https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop&auto=format&q=80&seed=${index}`
                                                }
                                                alt={track.title}
                                                className="w-full aspect-square rounded-lg object-cover shadow-2xl"
                                                whileHover={{ scale: 1.05 }}
                                                transition={{ duration: 0.3 }}
                                                onError={(e) => {
                                                    e.currentTarget.src = `https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop&auto=format&q=80&seed=${index}`;
                                                }}
                                            />
                                            <motion.div
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.8,
                                                    y: 10,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                    y: 0,
                                                }}
                                                className="absolute top-3 left-3 badge-new text-black text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 uppercase tracking-wider bg-green-500"
                                            >
                                                <Upload className="w-3 h-3" />
                                                NEW
                                            </motion.div>
                                            <motion.div
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.8,
                                                    y: 10,
                                                }}
                                                whileHover={{
                                                    opacity: 1,
                                                    scale: 1,
                                                    y: 0,
                                                }}
                                                className="play-button absolute bottom-2 right-2 w-12 h-12 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 bg-green-500 hover:bg-green-400 shadow-lg shadow-green-500/30"
                                            >
                                                <Play className="w-5 h-5 text-black ml-0.5 fill-current" />
                                            </motion.div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <h3 className="font-semibold text-sm text-white truncate group-hover:text-green-400 transition-colors duration-300">
                                                {track.title}
                                            </h3>
                                            <p className="text-xs text-zinc-400 truncate group-hover:text-zinc-300 transition-colors duration-300">
                                                {track.artist}
                                            </p>
                                            <div className="flex items-center gap-1.5 pt-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500/50 animate-pulse" />
                                                <span className="text-[10px] text-zinc-500 uppercase tracking-wide">
                                                    Uploaded
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {contextMenu && (
                                <ContextMenu
                                    x={contextMenu.x}
                                    y={contextMenu.y}
                                    track={contextMenu.track}
                                    onPlay={onTrackClick}
                                    onAddToPlaylist={(playlistId, trackId) => {
                                        import("@/lib/api").then(
                                            ({ playlistsApi }) => {
                                                playlistsApi.addTrack(
                                                    playlistId,
                                                    trackId
                                                );
                                            }
                                        );
                                    }}
                                    onDelete={(trackId) => {
                                        import("@/lib/api").then(
                                            ({ tracksApi }) => {
                                                tracksApi.delete(trackId);
                                            }
                                        );
                                    }}
                                    onClose={() => setContextMenu(null)}
                                />
                            )}
                        </div>
                    </div>
                </motion.section>

                {/* Your Playlists Section */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.6,
                        delay: 0.2,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-6 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full" />
                            <h2 className="text-2xl font-semibold text-white">
                                Your Playlists
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            {canScrollPlaylists && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-8 h-8 p-0 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full"
                                    onClick={() => scrollLeft(playlistsRef)}
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </Button>
                            )}
                            {canScrollPlaylists && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-8 h-8 p-0 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full"
                                    onClick={() => scrollRight(playlistsRef)}
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-8 h-8 p-0 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full"
                            >
                                <MoreHorizontal className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Animated slide container for playlists */}
                    <div className="relative">
                        {/* Background glow effect */}
                        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-purple-500/5 animate-pulse" />
                        </div>

                        <div
                            ref={playlistsRef}
                            className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide scroll-smooth pl-1"
                        >
                            <AnimatePresence>
                                {userPlaylistsLimited.map((playlist, index) => (
                                    <motion.div
                                        key={playlist.id}
                                        initial={{
                                            opacity: 0,
                                            x: -100,
                                            scale: 0.9,
                                            filter: "blur(10px)",
                                        }}
                                        animate={{
                                            opacity: 1,
                                            x: 0,
                                            scale: 1,
                                            filter: "blur(0px)",
                                        }}
                                        exit={{
                                            opacity: 0,
                                            x: -100,
                                            scale: 0.9,
                                            filter: "blur(10px)",
                                        }}
                                        transition={{
                                            duration: 0.6,
                                            delay: index * 0.03,
                                            ease: "easeOut",
                                        }}
                                        className="flex-shrink-0 w-52 rounded-xl p-4 cursor-pointer group relative bg-[#181818] border border-white/5 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300"
                                        onClick={() =>
                                            onTrackClick(
                                                tracks[0] ||
                                                    ({
                                                        id: 1,
                                                        title: playlist.name,
                                                        artist: "Playlist",
                                                    } as any)
                                            )
                                        }
                                    >
                                        <div className="relative mb-4">
                                            <motion.img
                                                src={
                                                    playlist.coverImage ||
                                                    `https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop&auto=format&q=80&seed=${index + 100}`
                                                }
                                                alt={playlist.name}
                                                className="w-full aspect-square rounded-lg object-cover shadow-2xl"
                                                whileHover={{ scale: 1.05 }}
                                                transition={{ duration: 0.3 }}
                                            />
                                            <div
                                                className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-lg"
                                                style={{
                                                    background: `linear-gradient(180deg, hsl(${(index * 45) % 360}, 70%, 60%), hsl(${(index * 45 + 30) % 360}, 70%, 50%))`,
                                                }}
                                            />
                                            <motion.div
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.8,
                                                    y: 10,
                                                }}
                                                className="play-button absolute bottom-2 right-2 w-12 h-12 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 bg-purple-500 hover:bg-purple-400 shadow-lg shadow-purple-500/30"
                                            >
                                                <Play className="w-5 h-5 text-black ml-0.5 fill-current" />
                                            </motion.div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <ListMusic className="w-3.5 h-3.5 text-zinc-500" />
                                                <h3 className="font-semibold text-sm text-white truncate group-hover:text-purple-400 transition-colors duration-300">
                                                    {playlist.name}
                                                </h3>
                                            </div>
                                            <p className="text-xs text-zinc-400 truncate group-hover:text-zinc-300 transition-colors duration-300">
                                                {playlist.description ||
                                                    "Your curated collection"}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.section>

                {/* Radios from your country */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.6,
                        delay: 0.3,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-6 bg-gradient-to-b from-amber-400 to-orange-600 rounded-full" />
                            <h2 className="text-2xl font-semibold text-white">
                                Radios from your country
                                <span className="text-zinc-500 text-lg font-normal ml-2">
                                    ({countryCode})
                                </span>
                            </h2>
                        </div>
                    </div>
                    {radiosLoading ? (
                        <div className="flex gap-5">
                            {[...Array(4)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex-shrink-0 w-52 h-48 bg-white/5 rounded-xl animate-pulse"
                                />
                            ))}
                        </div>
                    ) : radios.length === 0 ? (
                        <div className="text-zinc-400 flex items-center gap-2 py-8">
                            <Radio className="w-5 h-5 text-zinc-500" />
                            <span>No radios found for your country.</span>
                        </div>
                    ) : (
                        <React.Fragment>
                            <div className="flex items-center gap-2 mb-2">
                                {canScrollRadios && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-8 h-8 p-0 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full"
                                        onClick={() => scrollLeft(radiosRef)}
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </Button>
                                )}
                                {canScrollRadios && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-8 h-8 p-0 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full"
                                        onClick={() => scrollRight(radiosRef)}
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </Button>
                                )}
                            </div>
                            <div
                                ref={radiosRef}
                                className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide scroll-smooth pl-1"
                            >
                                <AnimatePresence>
                                    {radios.map((radio: any, idx: number) => (
                                        <motion.div
                                            key={radio.id || radio.stationuuid}
                                            initial={{
                                                opacity: 0,
                                                x: -100,
                                                scale: 0.9,
                                                filter: "blur(10px)",
                                            }}
                                            animate={{
                                                opacity: 1,
                                                x: 0,
                                                scale: 1,
                                                filter: "blur(0px)",
                                            }}
                                            exit={{
                                                opacity: 0,
                                                x: -100,
                                                scale: 0.9,
                                                filter: "blur(10px)",
                                            }}
                                            transition={{
                                                duration: 0.6,
                                                delay: idx * 0.03,
                                                ease: "easeOut",
                                            }}
                                            className="flex-shrink-0 w-52 rounded-xl p-4 group relative overflow-hidden bg-[#181818] border border-white/5 hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300"
                                        >
                                            {/* Radio wave decoration */}
                                            <div className="absolute top-3 right-3 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
                                                <Radio className="w-5 h-5 text-amber-400" />
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center border border-amber-500/20">
                                                        <Radio className="w-5 h-5 text-amber-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-sm text-white truncate group-hover:text-amber-400 transition-colors duration-300">
                                                            {radio.name}
                                                        </h3>
                                                        <p className="text-[10px] text-zinc-500 truncate">
                                                            {radio.country}
                                                        </p>
                                                    </div>
                                                </div>

                                                <p className="text-xs text-zinc-400 truncate">
                                                    {Array.isArray(
                                                        radio.language
                                                    )
                                                        ? radio.language.join(
                                                              ", "
                                                          )
                                                        : radio.language}
                                                </p>

                                                <div className="flex items-center justify-between pt-2">
                                                    <a
                                                        href={radio.homepage}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[10px] text-amber-400/70 hover:text-amber-400 transition-colors underline-offset-2 hover:underline"
                                                    >
                                                        Visit Station
                                                    </a>
                                                    <motion.button
                                                        whileHover={{
                                                            scale: 1.05,
                                                        }}
                                                        whileTap={{
                                                            scale: 0.95,
                                                        }}
                                                        className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/20"
                                                        title="Play Radio"
                                                        onClick={() =>
                                                            playRadio &&
                                                            playRadio(radio)
                                                        }
                                                    >
                                                        <Play className="w-4 h-4 text-black ml-0.5 fill-current" />
                                                    </motion.button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </React.Fragment>
                    )}
                </motion.section>

                {/* Recently Played Section */}
                {renderRecentlyPlayed && (
                    <motion.section
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.6,
                            delay: 0.4,
                            ease: [0.16, 1, 0.3, 1],
                        }}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-6 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full" />
                                <h2 className="text-2xl font-semibold text-white">
                                    Recently Played
                                </h2>
                            </div>
                            <div className="flex items-center gap-2">
                                {canScrollPlayed && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-8 h-8 p-0 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full"
                                        onClick={() =>
                                            scrollLeft(recentlyPlayedRef)
                                        }
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </Button>
                                )}
                                {canScrollPlayed && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-8 h-8 p-0 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full"
                                        onClick={() =>
                                            scrollRight(recentlyPlayedRef)
                                        }
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-8 h-8 p-0 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full"
                                >
                                    <MoreHorizontal className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Animated slide container */}
                        <div className="relative">
                            {/* Background glow effect */}
                            <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-blue-500/5 animate-pulse" />
                            </div>

                            <div
                                ref={recentlyPlayedRef}
                                className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide scroll-smooth pl-1"
                            >
                                <AnimatePresence>
                                    {recentlyPlayedTracksFiltered.map(
                                        (trackWithCount, index) => (
                                            <motion.div
                                                key={trackWithCount.id}
                                                initial={{
                                                    opacity: 0,
                                                    x: -100,
                                                    scale: 0.9,
                                                    filter: "blur(10px)",
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    x: 0,
                                                    scale: 1,
                                                    filter: "blur(0px)",
                                                }}
                                                exit={{
                                                    opacity: 0,
                                                    x: -100,
                                                    scale: 0.9,
                                                    filter: "blur(10px)",
                                                }}
                                                transition={{
                                                    duration: 0.6,
                                                    delay: index * 0.05,
                                                    ease: "easeOut",
                                                }}
                                                className="flex-shrink-0 w-52 rounded-xl p-4 cursor-pointer group relative bg-[#181818] border border-white/5 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300"
                                                onClick={() =>
                                                    onTrackClick(trackWithCount)
                                                }
                                            >
                                                <div className="relative mb-4">
                                                    <motion.img
                                                        src={
                                                            trackWithCount.coverArt
                                                                ? tracksApi.getArtworkUrl(
                                                                      trackWithCount.id
                                                                  )
                                                                : `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&auto=format&q=80&seed=${index + 200}`
                                                        }
                                                        alt={
                                                            trackWithCount.title
                                                        }
                                                        className="w-full aspect-square rounded-lg object-cover shadow-2xl"
                                                        whileHover={{
                                                            scale: 1.05,
                                                        }}
                                                        transition={{
                                                            duration: 0.3,
                                                        }}
                                                        onError={(e) => {
                                                            e.currentTarget.src = `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&auto=format&q=80&seed=${index + 200}`;
                                                        }}
                                                    />
                                                    <motion.div
                                                        initial={{
                                                            opacity: 0,
                                                            scale: 0.8,
                                                            y: 10,
                                                        }}
                                                        animate={{
                                                            opacity: 1,
                                                            scale: 1,
                                                            y: 0,
                                                        }}
                                                        className="absolute top-3 left-3 badge-played text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 uppercase tracking-wider bg-blue-500"
                                                    >
                                                        <Clock className="w-3 h-3" />
                                                        PLAYED
                                                    </motion.div>
                                                    {/* Play count badge - only show if > 1 */}
                                                    {trackWithCount.playCount >
                                                        1 && (
                                                        <motion.div
                                                            initial={{
                                                                opacity: 0,
                                                                scale: 0.8,
                                                                y: 10,
                                                            }}
                                                            animate={{
                                                                opacity: 1,
                                                                scale: 1,
                                                                y: 0,
                                                            }}
                                                            className="absolute top-3 right-3 badge-plays text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 uppercase tracking-wider bg-blue-400"
                                                        >
                                                            <Music className="w-2.5 h-2.5" />
                                                            {
                                                                trackWithCount.playCount
                                                            }
                                                            x
                                                        </motion.div>
                                                    )}
                                                    <motion.div
                                                        initial={{
                                                            opacity: 0,
                                                            scale: 0.8,
                                                            y: 10,
                                                        }}
                                                        className="play-button absolute bottom-2 right-2 w-12 h-12 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 bg-blue-500 hover:bg-blue-400 shadow-lg shadow-blue-500/30"
                                                    >
                                                        <Play className="w-5 h-5 text-black ml-0.5 fill-current" />
                                                    </motion.div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <h3 className="font-semibold text-sm text-white truncate group-hover:text-blue-400 transition-colors duration-300">
                                                        {trackWithCount.title}
                                                    </h3>
                                                    <p className="text-xs text-zinc-400 truncate group-hover:text-zinc-300 transition-colors duration-300">
                                                        {trackWithCount.artist}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 pt-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50 animate-pulse" />
                                                        <span className="text-[10px] text-zinc-500 uppercase tracking-wide">
                                                            Recently played
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.section>
                )}
            </div>
        </div>
    );
}
