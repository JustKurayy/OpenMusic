import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { getCountryCode } from "@/lib/getCountryCode";
import { getStationsByCountry } from "@/lib/radioBrowserApi";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { useQuery } from "@tanstack/react-query";
import { tracksApi, type ApiTrack } from "@/lib/api";
import { playlistsApi, type ApiPlaylist } from "@/lib/api";
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
import { Card } from "@/components/ui/card";

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

    // Fetch user's playlists and user
    const { user } = useAuth();
    const { data: userPlaylists = [] } = useQuery<ApiPlaylist[]>({
        queryKey: ["/api/playlists"],
        enabled: !!user,
    });
    const userPlaylistsLimited: ApiPlaylist[] = userPlaylists.slice(0, 8);
    const recentTracks: ApiTrack[] = tracks.slice(0, 8);
    const recentlyPlayedTracks: ApiTrack[] = tracks.slice(8, 16);
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
        recentlyPlayedTracks.length,
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
                background: 'linear-gradient(180deg, hsl(0, 0%, 12%) 0%, hsl(0, 0%, 7%) 40%, hsl(0, 0%, 5%) 100%)',
            }}
        >
            {/* Ambient gradient orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute w-96 h-96 rounded-full blur-3xl opacity-20"
                    style={{
                        background: 'radial-gradient(circle, rgba(34, 197, 94, 0.3) 0%, transparent 70%)',
                        top: '10%',
                        left: '5%',
                    }}
                />
                <div
                    className="absolute w-80 h-80 rounded-full blur-3xl opacity-15"
                    style={{
                        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%)',
                        top: '30%',
                        right: '10%',
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
                    transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-6 bg-gradient-to-b from-green-400 to-green-600 rounded-full" />
                            <h2 className="section-header text-2xl">
                                Recently Uploaded
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            {canScrollRecent && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-8 h-8 p-0 text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
                                    onClick={() => scrollLeft(recentTracksRef)}
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </Button>
                            )}
                            {canScrollRecent && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-8 h-8 p-0 text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
                                    onClick={() => scrollRight(recentTracksRef)}
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-8 h-8 p-0 text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
                            >
                                <MoreHorizontal className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                    <div
                        ref={recentTracksRef}
                        className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide scroll-smooth pl-1"
                    >
                        <AnimatePresence>
                            {recentTracks.map((track, index) => (
                                <motion.div
                                    key={track.id}
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{
                                        duration: 0.4,
                                        delay: index * 0.05,
                                        ease: [0.16, 1, 0.3, 1]
                                    }}
                                    className="flex-shrink-0 w-52 music-card rounded-xl p-4 cursor-pointer group relative"
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
                                    <div className="relative mb-4 music-card-image">
                                        <img
                                            src={
                                                track.coverArt
                                                    ? tracksApi.getArtworkUrl(track.id)
                                                    : `https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop&auto=format&q=80&seed=${index}`
                                            }
                                            alt={track.title}
                                            className="w-full aspect-square rounded-lg object-cover shadow-2xl"
                                            onError={(e) => {
                                                e.currentTarget.src = `https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop&auto=format&q=80&seed=${index}`;
                                            }}
                                        />
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            className="absolute top-3 left-3 badge-new text-black text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 uppercase tracking-wider"
                                        >
                                            <Upload className="w-3 h-3" />
                                            NEW
                                        </motion.div>
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                            whileHover={{ opacity: 1, scale: 1, y: 0 }}
                                            className="play-button absolute bottom-2 right-2 w-12 h-12 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100"
                                        >
                                            <Play className="w-5 h-5 text-black ml-0.5 fill-current" />
                                        </motion.div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <h3 className="font-semibold text-sm text-white truncate group-hover:text-green-400 transition-colors duration-300">
                                            {track.title}
                                        </h3>
                                        <p className="text-xs text-neutral-400 truncate group-hover:text-neutral-300 transition-colors duration-300">
                                            {track.artist}
                                        </p>
                                        <div className="flex items-center gap-1.5 pt-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
                                            <span className="text-[10px] text-neutral-500 uppercase tracking-wide">
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
                </motion.section>

                {/* Your Playlists Section */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-6 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full" />
                            <h2 className="section-header text-2xl">
                                Your Playlists
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            {canScrollPlaylists && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-8 h-8 p-0 text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
                                    onClick={() => scrollLeft(playlistsRef)}
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </Button>
                            )}
                            {canScrollPlaylists && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-8 h-8 p-0 text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
                                    onClick={() => scrollRight(playlistsRef)}
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-8 h-8 p-0 text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
                            >
                                <MoreHorizontal className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                    <div
                        ref={playlistsRef}
                        className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide scroll-smooth pl-1"
                    >
                        <AnimatePresence>
                            {userPlaylistsLimited.map((playlist, index) => (
                                <motion.div
                                    key={playlist.id}
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{
                                        duration: 0.4,
                                        delay: index * 0.05,
                                        ease: [0.16, 1, 0.3, 1]
                                    }}
                                    className="flex-shrink-0 w-52 music-card rounded-xl p-4 cursor-pointer group relative"
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
                                    <div className="relative mb-4 music-card-image">
                                        <div className="relative">
                                            <img
                                                src={
                                                    playlist.coverImage ||
                                                    `https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop&auto=format&q=80&seed=${index + 100}`
                                                }
                                                alt={playlist.name}
                                                className="w-full aspect-square rounded-lg object-cover shadow-2xl"
                                            />
                                            <div
                                                className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-lg"
                                                style={{
                                                    background: `linear-gradient(180deg, hsl(${(index * 45) % 360}, 70%, 60%), hsl(${(index * 45 + 30) % 360}, 70%, 50%))`,
                                                }}
                                            />
                                        </div>
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                            className="play-button absolute bottom-2 right-2 w-12 h-12 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100"
                                        >
                                            <Play className="w-5 h-5 text-black ml-0.5 fill-current" />
                                        </motion.div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <ListMusic className="w-3.5 h-3.5 text-neutral-500" />
                                            <h3 className="font-semibold text-sm text-white truncate group-hover:text-purple-400 transition-colors duration-300">
                                                {playlist.name}
                                            </h3>
                                        </div>
                                        <p className="text-xs text-neutral-400 truncate group-hover:text-neutral-300 transition-colors duration-300">
                                            {playlist.description ||
                                                "Your curated collection"}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </motion.section>

                {/* Radios from your country - moved below playlists */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-6 bg-gradient-to-b from-amber-400 to-orange-600 rounded-full" />
                            <h2 className="section-header text-2xl">
                                Radios from your country
                                <span className="text-neutral-500 text-lg font-normal ml-2">
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
                                    className="flex-shrink-0 w-52 h-48 bg-neutral-800/50 rounded-xl animate-pulse"
                                />
                            ))}
                        </div>
                    ) : radios.length === 0 ? (
                        <div className="text-neutral-400 flex items-center gap-2 py-8">
                            <Radio className="w-5 h-5 text-neutral-500" />
                            <span>No radios found for your country.</span>
                        </div>
                    ) : (
                        <React.Fragment>
                            <div className="flex items-center gap-2 mb-2">
                                {canScrollRadios && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-8 h-8 p-0 text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
                                        onClick={() => scrollLeft(radiosRef)}
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </Button>
                                )}
                                {canScrollRadios && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-8 h-8 p-0 text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
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
                                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            transition={{
                                                duration: 0.4,
                                                delay: idx * 0.03,
                                                ease: [0.16, 1, 0.3, 1]
                                            }}
                                            className="flex-shrink-0 w-52 music-card rounded-xl p-4 group relative overflow-hidden"
                                        >
                                            {/* Radio wave decoration */}
                                            <div className="absolute top-3 right-3 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
                                                <Radio className="w-5 h-5 text-amber-400" />
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                                                        <Radio className="w-5 h-5 text-amber-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-sm text-white truncate group-hover:text-amber-400 transition-colors duration-300">
                                                            {radio.name}
                                                        </h3>
                                                        <p className="text-[10px] text-neutral-500 truncate">
                                                            {radio.country}
                                                        </p>
                                                    </div>
                                                </div>

                                                <p className="text-xs text-neutral-400 truncate">
                                                    {Array.isArray(radio.language)
                                                        ? radio.language.join(", ")
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
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
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
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-6 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full" />
                            <h2 className="section-header text-2xl">
                                Recently Played
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            {canScrollPlayed && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-8 h-8 p-0 text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
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
                                    className="w-8 h-8 p-0 text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
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
                                className="w-8 h-8 p-0 text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
                            >
                                <MoreHorizontal className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                    <div
                        ref={recentlyPlayedRef}
                        className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide scroll-smooth pl-1"
                    >
                        <AnimatePresence>
                            {recentlyPlayedTracks.map((track, index) => (
                                <motion.div
                                    key={track.id}
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{
                                        duration: 0.4,
                                        delay: index * 0.05,
                                        ease: [0.16, 1, 0.3, 1]
                                    }}
                                    className="flex-shrink-0 w-52 music-card rounded-xl p-4 cursor-pointer group relative"
                                    onClick={() => onTrackClick(track)}
                                >
                                    <div className="relative mb-4 music-card-image">
                                        <img
                                            src={
                                                track.coverArt
                                                    ? tracksApi.getArtworkUrl(track.id)
                                                    : `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&auto=format&q=80&seed=${index + 200}`
                                            }
                                            alt={track.title}
                                            className="w-full aspect-square rounded-lg object-cover shadow-2xl"
                                            onError={(e) => {
                                                e.currentTarget.src = `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&auto=format&q=80&seed=${index + 200}`;
                                            }}
                                        />
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                            className="badge-played absolute top-3 left-3 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 uppercase tracking-wider"
                                        >
                                            <Clock className="w-3 h-3" />
                                            PLAYED
                                        </motion.div>
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                            className="play-button absolute bottom-2 right-2 w-12 h-12 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100"
                                        >
                                            <Play className="w-5 h-5 text-black ml-0.5 fill-current" />
                                        </motion.div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <h3 className="font-semibold text-sm text-white truncate group-hover:text-blue-400 transition-colors duration-300">
                                            {track.title}
                                        </h3>
                                        <p className="text-xs text-neutral-400 truncate group-hover:text-neutral-300 transition-colors duration-300">
                                            {track.artist}
                                        </p>
                                        <div className="flex items-center gap-1.5 pt-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                                            <span className="text-[10px] text-neutral-500 uppercase tracking-wide">
                                                Recently played
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </motion.section>

                {/* Made For You Section - Commented out as requested */}
                {/*
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Made For You</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-gray-400 hover:text-white">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-gray-400 hover:text-white">
                <ChevronRight className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-gray-400 hover:text-white">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth pl-1">
            {madeForYouItems.map((item) => (
              <div
                key={item.id}
                className="flex-shrink-0 w-48 bg-gray-900 bg-opacity-40 hover:bg-opacity-60 rounded-lg p-4 cursor-pointer group transition-all duration-200 hover:scale-105 relative"
                onClick={() => onTrackClick(tracks[0] || { id: 1, title: item.title, artist: "Various Artists" } as any)}
              >
                <div className="relative mb-4">
                  <img 
                    src={item.image}
                    alt={item.title}
                    className="w-full aspect-square rounded-lg object-cover shadow-lg"
                  />
                  {item.type === "radio" && (
                    <div className="absolute top-2 left-2 bg-white text-black text-xs font-bold px-2 py-1 rounded">
                      RADIO
                    </div>
                  )}
                  <Button
                    size="sm"
                    className="absolute bottom-2 right-2 w-12 h-12 bg-green-500 hover:bg-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-105 flex items-center justify-center shadow-lg translate-y-2 group-hover:translate-y-0"
                  >
                    <Play className="w-5 h-5 text-black ml-0.5 fill-current" />
                  </Button>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm text-white truncate group-hover:text-green-400 transition-colors duration-200">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-400 truncate">
                    {item.subtitle}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">50</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        */}
            </div>
        </div>
    );
}
