import { motion } from "framer-motion";
import { Play, Music, Disc3, ListMusic } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export interface SongCardMenuItem {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    destructive?: boolean;
    separator?: boolean;
}

interface SongCardProps {
    title: string;
    subtitle: string;
    /** Full URL to a cover image */
    coverArtUrl?: string;
    /** Tailwind/CSS gradient for the placeholder background */
    gradientClass?: string;
    /** Icon to show inside the gradient placeholder */
    iconType?: "music" | "disc" | "playlist";
    /** Where to navigate when the card body is clicked */
    href?: string;
    /** Called when the card body is clicked (instead of href navigation) */
    onClick?: () => void;
    /** Called when the play button is clicked */
    onPlay?: (e: React.MouseEvent) => void;
    /** Whether this card is currently the active/playing item */
    isActive?: boolean;
    className?: string;
}

const ICON_MAP = {
    music: Music,
    disc: Disc3,
    playlist: ListMusic,
};

function CardInner({
    title,
    subtitle,
    coverArtUrl,
    gradientClass = "from-zinc-700 to-zinc-600",
    iconType = "music",
    onPlay,
    isActive,
}: Omit<SongCardProps, "href" | "onClick" | "className">) {
    const Icon = ICON_MAP[iconType];

    return (
        <motion.div
            className="group relative bg-[#181818] hover:bg-[#282828] rounded-md p-4 transition-colors duration-300 h-full"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
        >
            {/* Cover image */}
            <div className="relative mb-4">
                <div
                    className={cn(
                        "w-full aspect-square rounded-md flex items-center justify-center overflow-hidden shadow-lg",
                        !coverArtUrl && `bg-gradient-to-br ${gradientClass}`
                    )}
                >
                    {coverArtUrl ? (
                        <img
                            src={coverArtUrl}
                            alt={title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <Icon className="w-12 h-12 text-zinc-300 opacity-70" />
                    )}
                </div>

                {/* Hover play button */}
                {onPlay && (
                    <button
                        className={cn(
                            "absolute bottom-2 right-2 w-12 h-12 bg-green-500 hover:bg-green-400 rounded-full",
                            "flex items-center justify-center shadow-2xl",
                            "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0",
                            "transition-all duration-200 hover:scale-105 focus:outline-none",
                            isActive && "opacity-100 translate-y-0"
                        )}
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onPlay(e);
                        }}
                    >
                        <Play className="w-5 h-5 text-black ml-0.5 fill-current" />
                    </button>
                )}
            </div>

            {/* Text */}
            <p
                className={cn(
                    "font-bold text-sm mb-1 truncate",
                    isActive ? "text-green-400" : "text-white"
                )}
            >
                {title}
            </p>
            <p className="text-xs text-zinc-400 truncate leading-relaxed">
                {subtitle}
            </p>
        </motion.div>
    );
}

/**
 * Unified card used for tracks, playlists, and albums throughout the app.
 * Wrap it in a MediaContextMenu for right-click support.
 */
export default function SongCard({
    href,
    onClick,
    className,
    ...rest
}: SongCardProps) {
    if (href) {
        return (
            <div className={cn("cursor-pointer", className)}>
                <Link href={href} className="block">
                    <CardInner {...rest} />
                </Link>
            </div>
        );
    }

    return (
        <div
            className={cn("cursor-pointer", className)}
            onClick={onClick}
        >
            <CardInner {...rest} />
        </div>
    );
}
