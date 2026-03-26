import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import {
    tracksApi,
    playlistsApi,
    type ApiTrack,
    type ApiPlaylist,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayer } from "@/contexts/PlayerContext";
import { useToast } from "@/hooks/use-toast";
import TrackList from "@/components/TrackList";
import SongCard from "@/components/SongCard";
import MediaContextMenu from "@/components/MediaContextMenu";
import {
    Music,
    Plus,
    Search,
    Grid3X3,
    List,
    Clock,
    Play,
    Disc3,
    ListMusic,
    Trash2,
    Edit2,
} from "lucide-react";

type ViewMode = "list" | "grid";
type FilterType = "all" | "playlists" | "albums" | "tracks";

interface AlbumGroup {
    name: string;
    artist: string;
    tracks: ApiTrack[];
    coverTrackId?: number; // first track that has cover art
}

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.05 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 28 } },
};

export default function Library() {
    const { user } = useAuth();
    const { playTrack } = usePlayer();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [, navigate] = useLocation();

    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [filter, setFilter] = useState<FilterType>("all");
    const [searchQuery, setSearchQuery] = useState("");

    const { data: tracks = [], isLoading: tracksLoading } = useQuery<ApiTrack[]>({
        queryKey: ["/api/tracks"],
        enabled: !!user,
    });

    const { data: playlists = [], isLoading: playlistsLoading } = useQuery<ApiPlaylist[]>({
        queryKey: ["/api/playlists"],
        enabled: !!user,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => playlistsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
            toast({ title: "Playlist deleted" });
        },
        onError: () => toast({ title: "Failed to delete playlist", variant: "destructive" }),
    });

    const deleteTrackMutation = useMutation({
        mutationFn: (id: number) => tracksApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/tracks"] });
            toast({ title: "Track deleted" });
        },
        onError: () => toast({ title: "Failed to delete track", variant: "destructive" }),
    });

    const isLoading = tracksLoading || playlistsLoading;

    // ── Album grouping ────────────────────────────────────────────────────────
    const albums = useMemo<AlbumGroup[]>(() => {
        const map = new Map<string, ApiTrack[]>();
        for (const t of tracks) {
            if (t.album) {
                const existing = map.get(t.album) ?? [];
                map.set(t.album, [...existing, t]);
            }
        }
        return Array.from(map.entries()).map(([name, albumTracks]) => {
            const sorted = [...albumTracks].sort(
                (a, b) => (a.trackNumber ?? 999) - (b.trackNumber ?? 999)
            );
            const coverTrack = sorted.find((t) => t.coverArt);
            return {
                name,
                artist: sorted[0]?.artist ?? "Unknown Artist",
                tracks: sorted,
                coverTrackId: coverTrack?.id,
            };
        });
    }, [tracks]);

    // Tracks that don't belong to any album
    const looseTracks = useMemo(
        () => tracks.filter((t) => !t.album),
        [tracks]
    );

    // ── Filtering + search ────────────────────────────────────────────────────
    const filteredAlbums = albums.filter((a) =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const filteredPlaylists = playlists.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const filteredLooseTracks = looseTracks.filter(
        (t) =>
            t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );
    // "Tracks" filter shows ALL tracks (including album tracks)
    const filteredAllTracks = tracks.filter(
        (t) =>
            t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const showAlbums = filter === "all" || filter === "albums";
    const showPlaylists = filter === "all" || filter === "playlists";
    const showTracks = filter === "tracks";
    const showLooseTracks = filter === "all";

    const isEmpty = tracks.length === 0 && playlists.length === 0;

    if (isLoading) {
        return (
            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-zinc-900 to-black p-6">
                <div className="animate-pulse">
                    <div className="h-10 bg-zinc-800 rounded w-48 mb-8" />
                    <div className="flex gap-4 mb-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-8 bg-zinc-800 rounded w-20" />
                        ))}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="aspect-square bg-zinc-800 rounded-md" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            className="flex-1 overflow-y-auto min-h-screen"
            style={{ background: "linear-gradient(180deg, #1c1c1c 0%, #121212 15%, #121212 100%)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-white">Your Library</h1>
                    <Link href="/create-playlist">
                        <a>
                            <button className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-all duration-200">
                                <Plus className="w-6 h-6" />
                            </button>
                        </a>
                    </Link>
                </div>

                {isEmpty ? (
                    <div className="text-center py-20">
                        <Music className="w-24 h-24 text-zinc-500 mx-auto mb-6" />
                        <h2 className="text-2xl font-bold mb-3 text-white">
                            Start building your library
                        </h2>
                        <p className="text-zinc-400 text-lg mb-8 max-w-md mx-auto">
                            Upload your favourite tracks and create playlists to organise your
                            music collection.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Link href="/upload">
                                <a className="inline-flex items-center px-8 py-4 bg-green-500 text-black font-bold rounded-full hover:bg-green-400 hover:scale-105 transition-all duration-200">
                                    <Plus className="w-5 h-5 mr-2" />
                                    Upload Music
                                </a>
                            </Link>
                            <Link href="/create-playlist">
                                <a className="inline-flex items-center px-8 py-4 border-2 border-zinc-500 text-white font-bold rounded-full hover:bg-white hover:text-black transition-all duration-200">
                                    Create Playlist
                                </a>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Controls */}
                        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                            <div className="flex items-center gap-4 flex-wrap">
                                {/* Filter pills */}
                                <div className="flex gap-2 flex-wrap">
                                    {(["all", "playlists", "albums", "tracks"] as FilterType[]).map(
                                        (f) => (
                                            <button
                                                key={f}
                                                onClick={() => setFilter(f)}
                                                className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all duration-200 capitalize ${
                                                    filter === f
                                                        ? "bg-white text-black"
                                                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                                                }`}
                                            >
                                                {f}
                                            </button>
                                        )
                                    )}
                                </div>

                                {/* Search */}
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                    <input
                                        type="text"
                                        placeholder="Search in Your Library"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 bg-zinc-800 text-white placeholder-zinc-500 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                    />
                                </div>
                            </div>

                            {/* View toggle */}
                            <div className="flex items-center gap-1 bg-zinc-800 rounded-md p-1">
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`p-2 rounded transition-colors ${
                                        viewMode === "grid"
                                            ? "bg-zinc-700 text-white"
                                            : "text-zinc-400 hover:text-white"
                                    }`}
                                >
                                    <Grid3X3 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={`p-2 rounded transition-colors ${
                                        viewMode === "list"
                                            ? "bg-zinc-700 text-white"
                                            : "text-zinc-400 hover:text-white"
                                    }`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Content sections */}
                        <div className="space-y-10">
                            {/* ── Albums ─────────────────────────────────────── */}
                            {showAlbums && filteredAlbums.length > 0 && (
                                <section>
                                    {filter === "all" && (
                                        <h2 className="text-2xl font-bold text-white mb-5">Albums</h2>
                                    )}
                                    <AnimatePresence mode="wait">
                                        {viewMode === "grid" ? (
                                            <motion.div
                                                key="albums-grid"
                                                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5"
                                                variants={containerVariants}
                                                initial="hidden"
                                                animate="show"
                                            >
                                                {filteredAlbums.map((album) => (
                                                    <motion.div key={album.name} variants={itemVariants}>
                                                        <MediaContextMenu
                                                            showMoreButton
                                                            items={[
                                                                {
                                                                    label: "Play Album",
                                                                    icon: <Play className="w-4 h-4" />,
                                                                    onClick: () =>
                                                                        playTrack(album.tracks[0], album.tracks),
                                                                },
                                                            ]}
                                                        >
                                                            <SongCard
                                                                title={album.name}
                                                                subtitle={album.artist}
                                                                coverArtUrl={
                                                                    album.coverTrackId
                                                                        ? tracksApi.getArtworkUrl(album.coverTrackId)
                                                                        : undefined
                                                                }
                                                                gradientClass="from-zinc-600 to-zinc-800"
                                                                iconType="disc"
                                                                href={`/album/${encodeURIComponent(album.name)}`}
                                                                onPlay={() =>
                                                                    playTrack(album.tracks[0], album.tracks)
                                                                }
                                                            />
                                                        </MediaContextMenu>
                                                    </motion.div>
                                                ))}
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="albums-list"
                                                className="space-y-1"
                                                variants={containerVariants}
                                                initial="hidden"
                                                animate="show"
                                            >
                                                {filteredAlbums.map((album) => (
                                                    <motion.div key={album.name} variants={itemVariants}>
                                                        <MediaContextMenu
                                                            items={[
                                                                {
                                                                    label: "Play Album",
                                                                    icon: <Play className="w-4 h-4" />,
                                                                    onClick: () =>
                                                                        playTrack(album.tracks[0], album.tracks),
                                                                },
                                                            ]}
                                                        >
                                                            <Link href={`/album/${encodeURIComponent(album.name)}`}>
                                                                <a className="flex items-center gap-4 p-2 rounded-md hover:bg-zinc-800 group transition-colors cursor-pointer">
                                                                    <div className="w-12 h-12 rounded flex-shrink-0 overflow-hidden bg-zinc-700 flex items-center justify-center">
                                                                        {album.coverTrackId ? (
                                                                            <img
                                                                                src={tracksApi.getArtworkUrl(album.coverTrackId)}
                                                                                alt={album.name}
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                        ) : (
                                                                            <Disc3 className="w-6 h-6 text-zinc-400" />
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-semibold text-white truncate group-hover:text-green-400 transition-colors">
                                                                            {album.name}
                                                                        </p>
                                                                        <p className="text-sm text-zinc-400 truncate">
                                                                            Album • {album.artist}
                                                                        </p>
                                                                    </div>
                                                                    <span className="text-xs text-zinc-500">
                                                                        {album.tracks.length} songs
                                                                    </span>
                                                                </a>
                                                            </Link>
                                                        </MediaContextMenu>
                                                    </motion.div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </section>
                            )}

                            {/* ── Playlists ───────────────────────────────────── */}
                            {showPlaylists && filteredPlaylists.length > 0 && (
                                <section>
                                    {filter === "all" && (
                                        <h2 className="text-2xl font-bold text-white mb-5">Playlists</h2>
                                    )}
                                    <AnimatePresence mode="wait">
                                        {viewMode === "grid" ? (
                                            <motion.div
                                                key="playlists-grid"
                                                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5"
                                                variants={containerVariants}
                                                initial="hidden"
                                                animate="show"
                                            >
                                                {filteredPlaylists.map((playlist) => (
                                                    <motion.div key={playlist.id} variants={itemVariants}>
                                                        <MediaContextMenu
                                                            showMoreButton
                                                            items={[
                                                                {
                                                                    label: "Edit Playlist",
                                                                    icon: <Edit2 className="w-4 h-4" />,
                                                                    onClick: () =>
                                                                        navigate(`/playlist/${playlist.id}`),
                                                                },
                                                                {
                                                                    label: "Delete Playlist",
                                                                    icon: <Trash2 className="w-4 h-4" />,
                                                                    onClick: () =>
                                                                        deleteMutation.mutate(playlist.id),
                                                                    destructive: true,
                                                                    separator: true,
                                                                },
                                                            ]}
                                                        >
                                                            <SongCard
                                                                title={playlist.name}
                                                                subtitle={`By ${playlist.user?.name ?? "Unknown"}`}
                                                                coverArtUrl={playlist.coverImage ?? undefined}
                                                                gradientClass="from-purple-700 to-blue-800"
                                                                iconType="playlist"
                                                                href={`/playlist/${playlist.id}`}
                                                            />
                                                        </MediaContextMenu>
                                                    </motion.div>
                                                ))}
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="playlists-list"
                                                className="space-y-1"
                                                variants={containerVariants}
                                                initial="hidden"
                                                animate="show"
                                            >
                                                {filteredPlaylists.map((playlist) => (
                                                    <motion.div key={playlist.id} variants={itemVariants}>
                                                        <MediaContextMenu
                                                            items={[
                                                                {
                                                                    label: "Edit Playlist",
                                                                    icon: <Edit2 className="w-4 h-4" />,
                                                                    onClick: () =>
                                                                        navigate(`/playlist/${playlist.id}`),
                                                                },
                                                                {
                                                                    label: "Delete Playlist",
                                                                    icon: <Trash2 className="w-4 h-4" />,
                                                                    onClick: () =>
                                                                        deleteMutation.mutate(playlist.id),
                                                                    destructive: true,
                                                                    separator: true,
                                                                },
                                                            ]}
                                                        >
                                                            <Link href={`/playlist/${playlist.id}`}>
                                                                <a className="flex items-center gap-4 p-2 rounded-md hover:bg-zinc-800 group transition-colors cursor-pointer">
                                                                    <div className="w-12 h-12 rounded flex-shrink-0 overflow-hidden bg-gradient-to-br from-purple-700 to-blue-800 flex items-center justify-center">
                                                                        {playlist.coverImage ? (
                                                                            <img
                                                                                src={playlist.coverImage}
                                                                                alt={playlist.name}
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                        ) : (
                                                                            <ListMusic className="w-6 h-6 text-white" />
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-semibold text-white truncate group-hover:text-green-400 transition-colors">
                                                                            {playlist.name}
                                                                        </p>
                                                                        <p className="text-sm text-zinc-400 truncate">
                                                                            Playlist • {playlist.user?.name ?? "Unknown"}
                                                                        </p>
                                                                    </div>
                                                                </a>
                                                            </Link>
                                                        </MediaContextMenu>
                                                    </motion.div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </section>
                            )}

                            {/* ── All tracks (Tracks filter) ──────────────────── */}
                            {showTracks && filteredAllTracks.length > 0 && (
                                <section>
                                    {viewMode === "grid" ? (
                                        <motion.div
                                            key="all-tracks-grid"
                                            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5"
                                            variants={containerVariants}
                                            initial="hidden"
                                            animate="show"
                                        >
                                            {filteredAllTracks.map((track) => (
                                                <motion.div key={track.id} variants={itemVariants}>
                                                    <MediaContextMenu
                                                        showMoreButton
                                                        items={buildTrackMenuItems(track, { playTrack, tracks, deleteTrackMutation, navigate, playlists, queryClient, toast })}
                                                    >
                                                        <SongCard
                                                            title={track.title}
                                                            subtitle={track.artist}
                                                            coverArtUrl={
                                                                track.coverArt
                                                                    ? tracksApi.getArtworkUrl(track.id)
                                                                    : undefined
                                                            }
                                                            gradientClass="from-zinc-600 to-zinc-800"
                                                            iconType="music"
                                                            onPlay={() => playTrack(track, filteredAllTracks)}
                                                            onClick={() => playTrack(track, filteredAllTracks)}
                                                        />
                                                    </MediaContextMenu>
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    ) : (
                                        <div className="space-y-1">
                                            <div className="grid grid-cols-[16px_1fr_1fr_minmax(80px,auto)] gap-4 px-4 py-2 text-xs font-medium text-zinc-500 border-b border-zinc-800 mb-2 uppercase tracking-wider">
                                                <span>#</span>
                                                <span>Title</span>
                                                <span>Album</span>
                                                <Clock className="w-3.5 h-3.5 justify-self-end" />
                                            </div>
                                            <TrackList tracks={filteredAllTracks} showHeader={false} />
                                        </div>
                                    )}
                                </section>
                            )}

                            {/* ── Loose tracks (no album, shown in "All" filter) ── */}
                            {showLooseTracks && filteredLooseTracks.length > 0 && (
                                <section>
                                    {(albums.length > 0 || playlists.length > 0) && (
                                        <h2 className="text-2xl font-bold text-white mb-5">Songs</h2>
                                    )}
                                    {viewMode === "grid" ? (
                                        <motion.div
                                            key="loose-tracks-grid"
                                            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5"
                                            variants={containerVariants}
                                            initial="hidden"
                                            animate="show"
                                        >
                                            {filteredLooseTracks.map((track) => (
                                                <motion.div key={track.id} variants={itemVariants}>
                                                    <MediaContextMenu
                                                        showMoreButton
                                                        items={buildTrackMenuItems(track, { playTrack, tracks, deleteTrackMutation, navigate, playlists, queryClient, toast })}
                                                    >
                                                        <SongCard
                                                            title={track.title}
                                                            subtitle={track.artist}
                                                            coverArtUrl={
                                                                track.coverArt
                                                                    ? tracksApi.getArtworkUrl(track.id)
                                                                    : undefined
                                                            }
                                                            gradientClass="from-zinc-600 to-zinc-800"
                                                            iconType="music"
                                                            onPlay={() => playTrack(track, filteredLooseTracks)}
                                                            onClick={() => playTrack(track, filteredLooseTracks)}
                                                        />
                                                    </MediaContextMenu>
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    ) : (
                                        <div className="space-y-1">
                                            <div className="grid grid-cols-[16px_1fr_minmax(80px,auto)] gap-4 px-4 py-2 text-xs font-medium text-zinc-500 border-b border-zinc-800 mb-2 uppercase tracking-wider">
                                                <span>#</span>
                                                <span>Title</span>
                                                <Clock className="w-3.5 h-3.5 justify-self-end" />
                                            </div>
                                            <TrackList
                                                tracks={filteredLooseTracks}
                                                showHeader={false}
                                                showAlbum={false}
                                            />
                                        </div>
                                    )}
                                </section>
                            )}

                            {/* Empty search state */}
                            {searchQuery &&
                                filteredAlbums.length === 0 &&
                                filteredPlaylists.length === 0 &&
                                filteredAllTracks.length === 0 && (
                                    <div className="text-center py-16">
                                        <Search className="w-16 h-16 text-zinc-500 mx-auto mb-4" />
                                        <h3 className="text-xl font-semibold text-white mb-2">
                                            No results found
                                        </h3>
                                        <p className="text-zinc-400">
                                            Try different keywords
                                        </p>
                                    </div>
                                )}
                        </div>
                    </>
                )}
            </div>
        </motion.div>
    );
}

// ── Helper to build per-track context menu items ──────────────────────────────
function buildTrackMenuItems(
    track: ApiTrack,
    ctx: {
        playTrack: (t: ApiTrack, q: ApiTrack[]) => void;
        tracks: ApiTrack[];
        deleteTrackMutation: any;
        navigate: (path: string) => void;
        playlists: ApiPlaylist[];
        queryClient: any;
        toast: any;
    }
) {
    const addToPlaylistItems = ctx.playlists.map((p) => ({
        label: p.name,
        icon: <ListMusic className="w-4 h-4" />,
        onClick: async () => {
            try {
                await playlistsApi.addTrack(p.id, track.id);
                ctx.queryClient.invalidateQueries({ queryKey: ["/api/playlists", String(p.id)] });
                ctx.toast({ title: `Added to ${p.name}` });
            } catch {
                ctx.toast({ title: "Failed to add to playlist", variant: "destructive" });
            }
        },
    }));

    return [
        {
            label: "Play",
            icon: <Play className="w-4 h-4" />,
            onClick: () => ctx.playTrack(track, ctx.tracks),
        },
        ...(addToPlaylistItems.length > 0
            ? [
                  {
                      label: "Add to Playlist",
                      icon: <ListMusic className="w-4 h-4" />,
                      onClick: () => {},
                      submenu: addToPlaylistItems,
                      separator: true,
                  },
              ]
            : []),
        {
            label: "Delete",
            icon: <Trash2 className="w-4 h-4" />,
            onClick: () => ctx.deleteTrackMutation.mutate(track.id),
            destructive: true,
            separator: true,
        },
    ];
}
