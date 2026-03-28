import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { type ApiPlaylist } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function Sidebar() {
    const [location] = useLocation();
    const { user } = useAuth();
    const isGuest = user && (user as any).isGuest;

    const { data: playlists = [] } = useQuery<ApiPlaylist[]>({
        queryKey: ["/api/playlists"],
        enabled: !!user,
    });

    const mainNavItems = [
        { href: "/", label: "Home", icon: Home },
        { href: "/radio", label: "Radio", icon: Radio },
    ];

    return (
        <aside className="spotify-panel flex w-16 flex-col lg:w-80">
            <div className="border-b border-white/5 p-4 lg:p-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-spotify-green">
                        <Music className="h-4 w-4 text-black" />
                    </div>
                    <span className="hidden text-lg font-bold lg:block">
                        OpenMusic
                    </span>
                </div>
            </div>

            <nav className="p-2 lg:p-3">
                <ul className="space-y-1">
                    {mainNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location === item.href;

                        return (
                            <motion.li
                                key={item.href}
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "spotify-nav-item justify-center lg:justify-start",
                                        isActive && "spotify-nav-item-active"
                                    )}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span className="hidden lg:block">
                                        {item.label}
                                    </span>
                                </Link>
                            </motion.li>
                        );
                    })}
                </ul>
            </nav>

            <div className="px-2 lg:px-3">
                <Link
                    href="/library"
                    className="spotify-nav-item group justify-center lg:justify-between"
                >
                    <div className="flex items-center gap-3">
                        <Library className="h-5 w-5" />
                        <span className="hidden lg:block">Your Library</span>
                    </div>
                    <div className="hidden items-center gap-1 lg:flex">
                        <span className="rounded-full p-1 hover:bg-white/10">
                            <Plus className="h-3.5 w-3.5" />
                        </span>
                        <span className="rounded-full p-1 hover:bg-white/10">
                            <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                    </div>
                </Link>
            </div>

            <div className="min-h-0 flex-1 p-2 pt-3 lg:p-3">
                <div className="mb-2 hidden items-center justify-between px-2 text-xs text-gray-400 lg:flex">
                    <button className="rounded p-1 hover:text-white">
                        <Search className="h-4 w-4" />
                    </button>
                    <span className="flex items-center gap-1">
                        Recents
                        <List className="h-3 w-3" />
                    </span>
                </div>

                <ul className="space-y-1 overflow-y-auto">
                    <li>
                        <Link
                        href="/liked"
                        className="spotify-nav-item justify-center lg:justify-start"
                    >
                        <div className="hidden h-8 w-8 items-center justify-center rounded bg-gradient-to-br from-purple-600 to-blue-400 lg:flex">
                            <span className="text-sm text-white">♥</span>
                        </div>
                        <div className="hidden min-w-0 lg:block">
                            <p className="truncate text-sm text-white">Liked Songs</p>
                            <p className="truncate text-xs text-gray-400">
                                {playlists.length} liked songs
                            </p>
                        </div>
                        <Pin className="ml-auto hidden h-3.5 w-3.5 text-green-500 lg:block" />
                    </Link>
                    </li>

                    <li>
                        <Link
                            href="/upload"
                            className="spotify-nav-item justify-center lg:justify-start"
                        >
                            <div className="hidden h-8 w-8 items-center justify-center rounded bg-gradient-to-br from-green-600 to-green-400 lg:flex">
                                <Upload className="h-4 w-4 text-white" />
                            </div>
                            <div className="hidden min-w-0 lg:block">
                                <p className="truncate text-sm text-white">Upload Music</p>
                                <p className="truncate text-xs text-gray-400">
                                    Add your tracks
                                </p>
                            </div>
                        </Link>
                    </li>

                    {playlists.map((playlist) => (
                        <li key={playlist.id}>
                            <Link
                                href={`/playlist/${playlist.id}`}
                                className="spotify-nav-item justify-center lg:justify-start"
                            >
                                <div className="hidden h-8 w-8 items-center justify-center overflow-hidden rounded bg-[#2b2b2b] lg:flex">
                                    {playlist.coverImage ? (
                                        <img
                                            src={playlist.coverImage}
                                            alt={playlist.name}
                                            className="h-8 w-8 object-cover"
                                        />
                                    ) : (
                                        <Music className="h-4 w-4 text-gray-300" />
                                    )}
                                </div>
                                <div className="hidden min-w-0 lg:block">
                                    <p className="truncate text-sm text-white">{playlist.name}</p>
                                    <p className="truncate text-xs text-gray-400">
                                        Playlist • {playlist.user?.name || "Unknown"}
                                    </p>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>

            {user && isGuest && (
                <div className="hidden border-t border-white/5 p-3 lg:block">
                    <div className="flex items-center justify-between rounded-md bg-black/20 px-2 py-1.5">
                        <span className="inline-flex items-center rounded-full bg-green-500 px-2 py-0.5 text-xs font-medium text-black">
                            <Users className="mr-1 h-3 w-3" />
                            Guest
                        </span>
                        <button
                            onClick={() =>
                                (window.location.href = "/api/auth/google")
                            }
                            className="rounded-full p-1 text-green-500 transition hover:bg-white/10 hover:text-green-400"
                            title="Sign in with Google"
                        >
                            <ExternalLink className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </aside>
    );
}
