import { tracksApi } from "@/lib/api";
import { usePlayer } from "@/contexts/PlayerContext";
import {
    Heart,
    Repeat,
    Shuffle,
    Volume2,
    List,
    Mic2,
    VolumeX,
    Volume1,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";

// --- Custom Spotify-style SVGs ---
const PlayIcon = () => (
    <svg
        role="img"
        height="16"
        width="16"
        viewBox="0 0 16 16"
        fill="currentColor"
    >
        <path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"></path>
    </svg>
);

const PauseIcon = () => (
    <svg
        role="img"
        height="16"
        width="16"
        viewBox="0 0 16 16"
        fill="currentColor"
    >
        <path d="M2.7 1a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7H2.7zm6.6 0a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7H9.3z"></path>
    </svg>
);

const SkipBackIcon = () => (
    <svg
        role="img"
        height="16"
        width="16"
        viewBox="0 0 16 16"
        fill="currentColor"
    >
        <path d="M3.3 1a.7.7 0 0 1 .7.7v5.15l9.95-5.744a.7.7 0 0 1 1.05.606v12.575a.7.7 0 0 1-1.05.607L4 9.149V14.3a.7.7 0 0 1-.7.7H1.7a.7.7 0 0 1-.7-.7V1.7a.7.7 0 0 1 .7-.7h1.6z"></path>
    </svg>
);

const SkipForwardIcon = () => (
    <svg
        role="img"
        height="16"
        width="16"
        viewBox="0 0 16 16"
        fill="currentColor"
    >
        <path d="M12.7 1a.7.7 0 0 0-.7.7v5.15L2.05 1.107A.7.7 0 0 0 1 1.712v12.575a.7.7 0 0 0 1.05.607L12 9.149V14.3a.7.7 0 0 0 .7.7h1.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-1.6z"></path>
    </svg>
);

// --- New Custom Slider Component ---
function PlayerSlider({
    value,
    max,
    onChange,
    disabled = false,
}: {
    value: number;
    max: number;
    onChange: (val: number) => void;
    disabled?: boolean;
}) {
    const percentage = max > 0 ? (value / max) * 100 : 0;

    return (
        <div className="group relative w-full flex items-center h-4 cursor-pointer">
            {/* The actual hidden input for functionality */}
            <input
                type="range"
                min="0"
                max={max}
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(Number(e.target.value))}
                className="absolute w-full h-full opacity-0 z-20 cursor-pointer disabled:cursor-not-allowed"
            />

            {/* Visual Track Background */}
            <div className="absolute w-full h-[4px] bg-[#4d4d4d] rounded-full overflow-hidden">
                {/* Visual Progress Bar */}
                <div
                    className="h-full bg-white group-hover:bg-[#1db954] transition-colors duration-150"
                    style={{ width: `${percentage}%` }}
                />
            </div>

            {/* Visual Thumb - Small circle that appears on hover */}
            <div
                className="absolute h-3 w-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10 pointer-events-none"
                style={{
                    left: `calc(${percentage}% - 6px)`,
                }}
            />
        </div>
    );
}

function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export default function MusicPlayer({
    onToggleQueue,
}: {
    onToggleQueue?: () => void;
}) {
    const {
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        toggle,
        seekTo,
        setVolume,
        next,
        previous,
        showLyrics,
        toggleLyrics,
        currentRadio,
        isRadioPlaying,
        toggleRadio,
        repeatMode,
        setRepeatMode,
    } = usePlayer();

    const [isLiked, setIsLiked] = useState(false);
    const [isShuffled, setIsShuffled] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [prevVolume, setPrevVolume] = useState(volume);

    const isRadio = !!currentRadio;
    const VolumeIcon =
        !isMuted && volume > 0 ? (volume < 0.5 ? Volume1 : Volume2) : VolumeX;

    const toggleMute = () => {
        if (isMuted) {
            setVolume(prevVolume);
            setIsMuted(false);
        } else {
            setPrevVolume(volume);
            setVolume(0);
            setIsMuted(true);
        }
    };

    // --- FALLBACK STATE ---
    if (!currentTrack && !currentRadio) {
        return (
            <footer className="px-4 py-3 h-24 flex items-center">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-4 flex-1 min-w-0 max-w-sm">
                        <div className="w-14 h-14 bg-[#282828] rounded-md" />
                        <div className="space-y-2">
                            <div className="h-3 w-32 bg-[#282828] rounded-full" />
                            <div className="h-2 w-20 bg-[#282828] rounded-full" />
                        </div>
                    </div>
                    <div className="flex flex-col items-center space-y-3 flex-1 max-w-2xl text-[#4d4d4d]">
                        <div className="flex items-center space-x-6">
                            <Shuffle className="w-4 h-4" />
                            <SkipBackIcon />
                            <PauseIcon />
                            <SkipForwardIcon />
                            <Repeat className="w-4 h-4" />
                        </div>
                        <div className="w-full max-w-md h-[4px] bg-[#282828] rounded-full" />
                    </div>
                    <div className="flex items-center space-x-4 flex-1 justify-end max-w-sm text-[#4d4d4d]">
                        <Mic2 className="w-4 h-4" />
                        <List className="w-4 h-4" />
                        <Volume2 className="w-4 h-4" />
                        <div className="w-24 h-[4px] bg-[#282828] rounded-full" />
                    </div>
                </div>
            </footer>
        );
    }

    return (
        <footer className="px-4 py-3 h-24 flex items-center">
            <div className="flex items-center justify-between w-full">
                {/* Left: Metadata */}
                <div className="flex items-center space-x-4 flex-1 min-w-0 max-w-sm">
                    <img
                        src={
                            isRadio
                                ? currentRadio.favicon
                                : currentTrack?.coverArt
                                  ? tracksApi.getArtworkUrl(currentTrack.id)
                                  : ""
                        }
                        alt="Cover"
                        className="w-14 h-14 rounded-md object-cover shadow-2xl"
                    />
                    <div className="min-w-0">
                        <p className="font-semibold text-[14px] truncate text-white hover:underline cursor-pointer">
                            {isRadio ? currentRadio.name : currentTrack?.title}
                        </p>
                        <p className="text-[11px] text-[#b3b3b3] mt-0.5 truncate hover:underline hover:text-white cursor-pointer">
                            {isRadio
                                ? currentRadio.country
                                : currentTrack?.artist}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsLiked(!isLiked)}
                        className={`hover:bg-transparent ${isLiked ? "text-[#1db954]" : "text-[#b3b3b3] hover:text-white"}`}
                    >
                        <Heart
                            className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`}
                        />
                    </Button>
                </div>

                {/* Center: Playback Controls */}
                <div className="flex flex-col items-center space-y-2 flex-1 max-w-2xl">
                    <div className="flex items-center space-x-6">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsShuffled(!isShuffled)}
                            className={`hover:bg-transparent ${isShuffled ? "text-[#1db954]" : "text-[#b3b3b3] hover:text-white"}`}
                        >
                            <Shuffle
                                className={`w-4 h-4 ${isShuffled ? "fill-current" : ""}`}
                            />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-[#b3b3b3] hover:text-white hover:bg-transparent"
                            onClick={previous}
                        >
                            <SkipBackIcon />
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-8 h-8 bg-white text-black rounded-full hover:scale-105 transition-transform flex items-center justify-center p-0"
                            onClick={isRadio ? toggleRadio : toggle}
                        >
                            {(isRadio ? isRadioPlaying : isPlaying) ? (
                                <PauseIcon />
                            ) : (
                                <PlayIcon />
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-[#b3b3b3] hover:text-white hover:bg-transparent"
                            onClick={next}
                        >
                            <SkipForwardIcon />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                                setRepeatMode((prev) => (prev + 1) % 3)
                            }
                            className={`hover:bg-transparent ${repeatMode > 0 ? "text-[#1db954]" : "text-[#b3b3b3] hover:text-white"}`}
                        >
                            <Repeat
                                className={`w-4 h-4 ${repeatMode > 0 ? "fill-current" : ""}`}
                            />
                        </Button>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="flex items-center space-x-2 w-full max-w-md">
                        <span className="text-[11px] text-[#b3b3b3] min-w-[35px] text-right tabular-nums">
                            {formatTime(currentTime)}
                        </span>
                        <PlayerSlider
                            value={currentTime}
                            max={duration || 100}
                            onChange={(val) => seekTo(val)}
                        />
                        <span className="text-[11px] text-[#b3b3b3] min-w-[35px] tabular-nums">
                            {formatTime(duration)}
                        </span>
                    </div>
                </div>

                {/* Right: Utility Controls */}
                <div className="flex items-center space-x-3 flex-1 justify-end max-w-sm">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleLyrics}
                        className={`hover:bg-transparent ${showLyrics ? "text-[#1db954]" : "text-[#b3b3b3] hover:text-white"}`}
                    >
                        <Mic2 className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#b3b3b3] hover:text-white hover:bg-transparent"
                        onClick={onToggleQueue}
                    >
                        <List className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center space-x-2 w-32">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleMute}
                            className="text-[#b3b3b3] hover:text-white hover:bg-transparent p-0"
                        >
                            <VolumeIcon className="w-4 h-4" />
                        </Button>
                        <PlayerSlider
                            value={isMuted ? 0 : volume * 100}
                            max={100}
                            onChange={(val) => {
                                setVolume(val / 100);
                                if (val > 0) setIsMuted(false);
                            }}
                        />
                    </div>
                </div>
            </div>
        </footer>
    );
}
