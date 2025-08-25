import { usePlayer } from "@/contexts/PlayerContext";
import {
    Heart,
    SkipBack,
    SkipForward,
    Play,
    Pause,
    Repeat,
    Shuffle,
    Volume2,
    List,
    Monitor,
    Mic2,
    PictureInPicture,
    Maximize2,
    VolumeX,
    Volume1,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useState } from "react";

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
        setRadioVolume,
    } = usePlayer();

    const [isLiked, setIsLiked] = useState(false);
    const [isShuffled, setIsShuffled] = useState(false);
    const [repeatMode, setRepeatMode] = useState(0); // 0: off, 1: all, 2: one
    const [isMuted, setIsMuted] = useState(false);
    const [previousVolume, setPreviousVolume] = useState(volume);

    const getVolumeIcon = () => {
        if (isMuted || volume === 0) return VolumeX;
        if (volume < 0.33) return Volume1;
        if (volume < 0.66) return Volume2;
        return Volume2;
    };

    const toggleMute = () => {
        if (isMuted) {
            setVolume(previousVolume);
            setIsMuted(false);
        } else {
            setPreviousVolume(volume);
            setVolume(0);
            setIsMuted(true);
        }
    };

    const toggleRepeat = () => {
        setRepeatMode((prev) => (prev + 1) % 3);
    };

    if (!currentTrack && !currentRadio) {
        // No track or radio playing
        return (
            <footer className="bg-black px-4 py-3 h-24 flex items-center">
                <div className="flex items-center justify-between w-full">
                    {/* Empty Info */}
                    <div className="flex items-center space-x-4 flex-1 min-w-0 max-w-sm">
                        <div className="w-14 h-14 bg-gray-800 rounded-md flex items-center justify-center">
                            <div className="w-6 h-6 bg-gray-600 rounded"></div>
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="h-4 bg-gray-700 rounded w-32 mb-1"></div>
                            <div className="h-3 bg-gray-700 rounded w-24"></div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 cursor-not-allowed"
                            disabled
                        >
                            <Heart className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Player Controls (disabled) */}
                    <div className="flex flex-col items-center space-y-2 flex-1 max-w-2xl">
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 opacity-50 cursor-not-allowed"
                                disabled
                            >
                                <Shuffle className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 opacity-50 cursor-not-allowed"
                                disabled
                            >
                                <SkipBack className="w-5 h-5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-8 h-8 bg-white text-black rounded-full opacity-50 cursor-not-allowed"
                                disabled
                            >
                                <Play className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 opacity-50 cursor-not-allowed"
                                disabled
                            >
                                <SkipForward className="w-5 h-5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 opacity-50 cursor-not-allowed"
                                disabled
                            >
                                <Repeat className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="flex items-center space-x-2 w-full max-w-md">
                            <span className="text-xs text-gray-600 w-10 text-right">
                                0:00
                            </span>
                            <div className="flex-1 h-1 bg-gray-700 rounded-full">
                                <div className="h-1 bg-gray-600 rounded-full w-0"></div>
                            </div>
                            <span className="text-xs text-gray-600 w-10">
                                0:00
                            </span>
                        </div>
                    </div>

                    {/* Right Controls (disabled) */}
                    <div className="flex items-center space-x-1 flex-1 justify-end max-w-sm">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 opacity-50 cursor-not-allowed"
                            disabled
                        >
                            <Mic2 className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 opacity-50 cursor-not-allowed"
                            disabled
                        >
                            <List className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center space-x-2 group">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 opacity-50 cursor-not-allowed"
                                disabled
                            >
                                <Volume2 className="w-4 h-4" />
                            </Button>
                            <div className="w-24">
                                <Slider
                                    value={[0]}
                                    max={100}
                                    step={1}
                                    disabled
                                    className="[&_.slider-track]:bg-gray-600 [&_.slider-range]:bg-white [&_.slider-thumb]:bg-white"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        );
    }

    // Show radio info if radio is playing
    const isRadio = !!currentRadio;
    const handleProgressChange = (values: number[]) => {
        seekTo(values[0]);
    };

    const handleVolumeChange = (values: number[]) => {
        const newVolume = values[0] / 100;
        if (isRadio && setRadioVolume) {
            setRadioVolume(newVolume);
        } else {
            setVolume(newVolume);
        }
        if (newVolume > 0 && isMuted) {
            setIsMuted(false);
        }
    };

    const VolumeIcon = getVolumeIcon();

    return (
        <footer className="bg-black px-4 py-3 h-24 flex items-center">
            <div className="flex items-center justify-between w-full">
                {/* Currently Playing Info */}
                <div className="flex items-center space-x-4 flex-1 min-w-0 max-w-sm">
                    {isRadio ? (
                        <div className="relative group cursor-pointer">
                            <img
                                src={
                                    currentRadio.favicon ||
                                    `https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=56&h=56&fit=crop`
                                }
                                alt="Radio logo"
                                className="w-14 h-14 rounded-md object-cover shadow-lg bg-white"
                                onError={(e) => {
                                    e.currentTarget.src = `https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=56&h=56&fit=crop`;
                                }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-md transition-all duration-200 flex items-center justify-center">
                                <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                            </div>
                        </div>
                    ) : (
                        <div className="relative group cursor-pointer">
                            <img
                                src={`https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=56&h=56&fit=crop`}
                                alt="Album cover"
                                className="w-14 h-14 rounded-md object-cover shadow-lg"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-md transition-all duration-200 flex items-center justify-center">
                                <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                            </div>
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        {isRadio ? (
                            <button className="text-left w-full">
                                <p className="font-medium text-sm truncate text-white hover:underline cursor-pointer">
                                    {currentRadio.name}
                                </p>
                                <p className="text-xs text-gray-400 truncate hover:underline hover:text-white cursor-pointer">
                                    {currentRadio.country}
                                </p>
                            </button>
                        ) : (
                            <button className="text-left w-full">
                                <p className="font-medium text-sm truncate text-white hover:underline cursor-pointer">
                                    {currentTrack?.title ?? ""}
                                </p>
                                <p className="text-xs text-gray-400 truncate hover:underline hover:text-white cursor-pointer">
                                    {currentTrack?.artist ?? ""}
                                </p>
                            </button>
                        )}
                    </div>
                    {/* <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsLiked(!isLiked)}
                        className={`${isLiked ? "text-green-500 hover:text-green-400" : "text-gray-400 hover:text-white"} transition-colors duration-200`}
                        disabled={isRadio}
                    >
                        <Heart
                            className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`}
                        />
                    </Button> */}
                </div>

                {/* Player Controls */}
                <div className="flex flex-col items-center space-y-2 flex-1 max-w-2xl">
                    <div className="flex items-center space-x-2">
                        {isRadio ? (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-8 h-8 bg-white text-black rounded-full hover:scale-105 hover:bg-gray-100 transition-all duration-200 flex items-center justify-center"
                                    onClick={toggleRadio}
                                    title={isRadioPlaying ? "Pause" : "Play"}
                                >
                                    {isRadioPlaying ? (
                                        <Pause className="w-4 h-4" />
                                    ) : (
                                        <Play className="w-4 h-4 ml-0.5" />
                                    )}
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsShuffled(!isShuffled)}
                                    className={`${isShuffled ? "text-green-500" : "text-gray-400 hover:text-white"} transition-colors duration-200`}
                                    title={
                                        isShuffled
                                            ? "Disable shuffle"
                                            : "Enable shuffle"
                                    }
                                >
                                    <Shuffle className="w-4 h-4" />
                                    {isShuffled && (
                                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full"></div>
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-400 hover:text-white transition-colors duration-200"
                                    onClick={previous}
                                    title="Previous"
                                >
                                    <SkipBack className="w-5 h-5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-8 h-8 bg-white text-black rounded-full hover:scale-105 hover:bg-gray-100 transition-all duration-200 flex items-center justify-center"
                                    onClick={toggle}
                                    title={isPlaying ? "Pause" : "Play"}
                                >
                                    {isPlaying ? (
                                        <Pause className="w-4 h-4" />
                                    ) : (
                                        <Play className="w-4 h-4 ml-0.5" />
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-400 hover:text-white transition-colors duration-200"
                                    onClick={next}
                                    title="Next"
                                >
                                    <SkipForward className="w-5 h-5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={toggleRepeat}
                                    className={`${repeatMode > 0 ? "text-green-500" : "text-gray-400 hover:text-white"} transition-colors duration-200 relative`}
                                    title={
                                        repeatMode === 0
                                            ? "Enable repeat"
                                            : repeatMode === 1
                                              ? "Repeat all"
                                              : "Repeat one"
                                    }
                                >
                                    <Repeat className="w-4 h-4" />
                                    {repeatMode === 2 && (
                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full text-xs flex items-center justify-center">
                                            <span className="text-black text-xs font-bold">
                                                1
                                            </span>
                                        </span>
                                    )}
                                    {repeatMode > 0 && (
                                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full"></div>
                                    )}
                                </Button>
                            </>
                        )}
                    </div>

                    {isRadio ? (
                        <div className="flex items-center space-x-2 w-full max-w-md">
                            <span className="text-xs text-gray-400 w-10 text-right">
                                Live
                            </span>
                            <div className="flex-1 h-1 bg-gray-700 rounded-full">
                                <div className="h-1 bg-green-500 rounded-full w-full"></div>
                            </div>
                            <span className="text-xs text-gray-400 w-10">
                                Radio
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-2 w-full max-w-md">
                            <span className="text-xs text-gray-400 w-10 text-right">
                                {formatTime(currentTime)}
                            </span>
                            <div className="flex-1 group">
                                <Slider
                                    value={[currentTime]}
                                    max={duration || 100}
                                    step={1}
                                    onValueChange={handleProgressChange}
                                    className="w-full [&_.slider-track]:bg-gray-600 [&_.slider-range]:bg-white [&_.slider-thumb]:bg-white [&_.slider-thumb]:opacity-0 group-hover:[&_.slider-thumb]:opacity-100 [&_.slider-thumb]:w-3 [&_.slider-thumb]:h-3 hover:[&_.slider-range]:bg-green-500"
                                />
                            </div>
                            <span className="text-xs text-gray-400 w-10">
                                {formatTime(duration)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Right Controls */}
                <div className="flex items-center space-x-1 flex-1 justify-end max-w-sm">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleLyrics}
                        className={`${showLyrics ? "text-green-500" : "text-gray-400 hover:text-white"} transition-colors duration-200`}
                        title={showLyrics ? "Hide lyrics" : "Show lyrics"}
                        disabled={isRadio}
                    >
                        <Mic2 className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white transition-colors duration-200"
                        title="Queue"
                        onClick={onToggleQueue}
                        disabled={isRadio && !currentRadio?.queue}
                    >
                        <List className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center space-x-2 group">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleMute}
                            className="text-gray-400 hover:text-white transition-colors duration-200"
                            title={isMuted ? "Unmute" : "Mute"}
                        >
                            <VolumeIcon className="w-4 h-4" />
                        </Button>
                        <div className="w-24">
                            <Slider
                                value={[isMuted ? 0 : volume * 100]}
                                max={100}
                                step={1}
                                onValueChange={handleVolumeChange}
                                className="[&_.slider-track]:bg-gray-600 [&_.slider-range]:bg-white [&_.slider-thumb]:bg-white [&_.slider-thumb]:opacity-0 group-hover:[&_.slider-thumb]:opacity-100 [&_.slider-thumb]:w-3 [&_.slider-thumb]:h-3 hover:[&_.slider-range]:bg-green-500"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
