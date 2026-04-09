import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
    Home,
    Search,
    Library,
    Upload,
    Plus,
    Music,
    Users,
    ExternalLink,
    List,
    ArrowRight,
    Pin,
    Radio,
    Sparkles,
    Heart,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { likesApi, type ApiPlaylist } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function Sidebar() {
    const [location] = useLocation();
    const { user } = useAuth();
    const isGuest = user && (user as any).isGuest;

    const { data: playlists = [] } = useQuery<ApiPlaylist[]>({
        queryKey: ["/api/playlists"],
        enabled: !!user,
    });

    const { data: likedTracks = [] } = useQuery<
        Awaited<ReturnType<typeof likesApi.getUserLikes>>
    >({
        queryKey: ["/api/likes/user"],
        enabled: !!user,
    });

    const mainNavItems = [
        { href: "/", label: "Home", icon: Home, color: "green" },
        { href: "/radio", label: "Radio", icon: Radio, color: "amber" },
    ] as const;

    return (
        <aside
            className="flex w-16 flex-col lg:w-72 relative overflow-hidden rounded-lg"
            style={{
                background:
                    "linear-gradient(180deg, hsl(0, 0%, 10%) 0%, hsl(0, 0%, 7%) 100%)",
            }}
        >
            {/* Ambient glow */}
            <div
                className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
                style={{
                    background:
                        "radial-gradient(ellipse at top, rgba(34, 197, 94, 0.08) 0%, transparent 70%)",
                }}
            />

            {/* Logo */}
            <div className="relative border-b border-white/5 p-4 lg:p-5">
                <Link href="/" className="flex items-center gap-3 group">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="relative flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{
                            background:
                                "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                            boxShadow: "0 4px 16px rgba(34, 197, 94, 0.3)",
                        }}
                    >
                        <Music className="h-5 w-5 text-black" />
                        <motion.div
                            className="absolute inset-0 rounded-xl"
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            style={{
                                background:
                                    "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%)",
                            }}
                        />
                    </motion.div>
                    <div className="hidden lg:block">
                        <span className="text-lg font-bold bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
                            OpenMusic
                        </span>
                    </div>
                </Link>
            </div>

            {/* Main Navigation */}
            <nav className="relative p-2 lg:p-3">
                <ul className="space-y-1">
                    {mainNavItems.map((item, index) => {
                        const Icon = item.icon;
                        const isActive = location === item.href;
                        const colorMap = {
                            green: {
                                bg: "rgba(34, 197, 94, 0.15)",
                                text: "#22c55e",
                                glow: "rgba(34, 197, 94, 0.2)",
                            },
                            amber: {
                                bg: "rgba(251, 191, 36, 0.15)",
                                text: "#fbbf24",
                                glow: "rgba(251, 191, 36, 0.2)",
                            },
                        };
                        const colors = colorMap[item.color];

                        return (
                            <motion.li
                                key={item.href}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                    duration: 0.3,
                                    delay: index * 0.05,
                                }}
                            >
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-300 justify-center lg:justify-start",
                                        isActive
                                            ? "text-white"
                                            : "text-neutral-400 hover:text-white"
                                    )}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeNav"
                                            className="absolute inset-0 rounded-lg"
                                            style={{
                                                background: colors.bg,
                                                boxShadow: `inset 0 0 0 1px ${colors.glow}`,
                                            }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 350,
                                                damping: 30,
                                            }}
                                        />
                                    )}
                                    <Icon
                                        className="h-5 w-5 relative z-10 transition-all duration-300 group-hover:scale-110"
                                        style={{
                                            color: isActive
                                                ? colors.text
                                                : "currentColor",
                                        }}
                                    />
                                    <span className="hidden lg:block relative z-10 font-medium text-sm">
                                        {item.label}
                                    </span>
                                    {isActive && (
                                        <div
                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full"
                                            style={{ background: colors.text }}
                                        />
                                    )}
                                </Link>
                            </motion.li>
                        );
                    })}
                </ul>
            </nav>

            {/* Library Section */}
            <div className="px-2 lg:px-3">
                <Link
                    href="/library"
                    className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-300 justify-center lg:justify-between",
                        location === "/library"
                            ? "text-white"
                            : "text-neutral-400 hover:text-white"
                    )}
                >
                    {location === "/library" && (
                        <motion.div
                            layoutId="activeLibrary"
                            className="absolute inset-0 rounded-lg"
                            style={{
                                background: "rgba(168, 85, 247, 0.15)",
                                boxShadow:
                                    "inset 0 0 0 1px rgba(168, 85, 247, 0.2)",
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 350,
                                damping: 30,
                            }}
                        />
                    )}
                    <div className="flex items-center gap-3 relative z-10">
                        <Library
                            className="h-5 w-5 transition-all duration-300 group-hover:scale-110"
                            style={{
                                color:
                                    location === "/library"
                                        ? "#a855f7"
                                        : "currentColor",
                            }}
                        />
                        <span className="hidden lg:block font-medium text-sm">
                            Your Library
                        </span>
                    </div>
                    <div className="hidden items-center gap-1 lg:flex relative z-10">
                        <motion.span
                            whileHover={{ scale: 1.1 }}
                            className="rounded-full p-1.5 hover:bg-white/10 transition-colors"
                        >
                            <Plus className="h-3.5 w-3.5" />
                        </motion.span>
                    </div>
                </Link>
            </div>

            {/* Divider */}
            <div className="mx-4 my-2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* Playlist Section */}
            <div className="min-h-0 flex-1 p-2 pt-1 lg:p-3 overflow-y-auto scrollbar-hide">
                <div className="mb-3 hidden items-center justify-between px-2 text-xs lg:flex">
                    <span className="text-neutral-500 font-medium tracking-wide uppercase text-[10px]">
                        Playlists
                    </span>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        className="rounded-full p-1.5 text-neutral-500 hover:text-white hover:bg-white/5 transition-all"
                    >
                        <Search className="h-3.5 w-3.5" />
                    </motion.button>
                </div>

                <ul className="space-y-0.5">
                    {/* Liked Songs */}
                    <motion.li
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                    >
                        <Link
                            href="/likes"
                            className="group relative flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-300 justify-center lg:justify-start text-neutral-400 hover:text-white"
                        >
                            <div
                                className="hidden h-9 w-9 items-center justify-center rounded-lg lg:flex relative overflow-hidden"
                                style={{
                                    background:
                                        "linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)",
                                    boxShadow:
                                        "0 4px 12px rgba(124, 58, 237, 0.3)",
                                }}
                            >
                                <Heart className="h-4 w-4 text-white fill-white" />
                            </div>
                            <div className="hidden min-w-0 flex-1 lg:block">
                                <p className="truncate text-sm font-medium text-white group-hover:text-purple-400 transition-colors">
                                    Liked Songs
                                </p>
                                <p className="truncate text-xs text-neutral-500">
                                    {likedTracks.length} songs
                                </p>
                            </div>
                            <Pin className="ml-auto hidden h-3.5 w-3.5 text-green-500 lg:block" />
                        </Link>
                    </motion.li>

                    {/* Upload Music */}
                    <motion.li
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.15 }}
                    >
                        <Link
                            href="/upload"
                            className="group relative flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-300 justify-center lg:justify-start text-neutral-400 hover:text-white"
                        >
                            <div
                                className="hidden h-9 w-9 items-center justify-center rounded-lg lg:flex relative overflow-hidden"
                                style={{
                                    background:
                                        "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                                    boxShadow:
                                        "0 4px 12px rgba(34, 197, 94, 0.3)",
                                }}
                            >
                                <Upload className="h-4 w-4 text-black" />
                            </div>
                            <div className="hidden min-w-0 flex-1 lg:block">
                                <p className="truncate text-sm font-medium text-white group-hover:text-green-400 transition-colors">
                                    Upload Music
                                </p>
                                <p className="truncate text-xs text-neutral-500">
                                    Add your tracks
                                </p>
                            </div>
                        </Link>
                    </motion.li>

                    {/* Playlist divider */}
                    <div className="mx-3 my-2 h-px bg-white/5 hidden lg:block" />

                    {/* User Playlists */}
                    <AnimatePresence>
                        {playlists.map((playlist, index) => (
                            <motion.li
                                key={playlist.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{
                                    duration: 0.2,
                                    delay: 0.2 + index * 0.03,
                                }}
                            >
                                <Link
                                    href={`/playlist/${playlist.id}`}
                                    className="group relative flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-300 justify-center lg:justify-start text-neutral-400 hover:text-white"
                                >
                                    <div className="hidden h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-neutral-800 lg:flex">
                                        {playlist.coverImage ? (
                                            <img
                                                src={playlist.coverImage}
                                                alt={playlist.name}
                                                className="h-9 w-9 object-cover"
                                            />
                                        ) : (
                                            <Music className="h-4 w-4 text-neutral-500" />
                                        )}
                                    </div>
                                    <div className="hidden min-w-0 flex-1 lg:block">
                                        <p className="truncate text-sm font-medium text-white group-hover:text-neutral-200 transition-colors">
                                            {playlist.name}
                                        </p>
                                        <p className="truncate text-xs text-neutral-500">
                                            Playlist •{" "}
                                            {playlist.user?.name || "You"}
                                        </p>
                                    </div>
                                </Link>
                            </motion.li>
                        ))}
                    </AnimatePresence>
                </ul>
            </div>

            {/* Guest Banner */}
            {user && isGuest && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative m-3 hidden overflow-hidden rounded-xl lg:block"
                    style={{
                        background:
                            "linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)",
                        border: "1px solid rgba(34, 197, 94, 0.2)",
                    }}
                >
                    <div className="relative p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 rounded-full bg-green-500/20 px-2.5 py-1">
                                <Users className="h-3 w-3 text-green-400" />
                                <span className="text-xs font-medium text-green-400">
                                    Guest
                                </span>
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() =>
                                (window.location.href = "/api/auth/google")
                            }
                            className="rounded-full bg-white/10 p-2 text-green-400 transition-colors hover:bg-white/20 hover:text-green-300"
                            title="Sign in with Google"
                        >
                            <ExternalLink className="h-4 w-4" />
                        </motion.button>
                    </div>
                </motion.div>
            )}
        </aside>
    );
}
