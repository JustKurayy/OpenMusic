import { usePlayer } from "@/contexts/PlayerContext";
import { Heart, SkipBack, SkipForward, Play, Pause, Repeat, Shuffle, Volume2, List, Monitor } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default function MusicPlayer() {
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
  } = usePlayer();

  if (!currentTrack) {
    return null;
  }

  const handleProgressChange = (values: number[]) => {
    seekTo(values[0]);
  };

  const handleVolumeChange = (values: number[]) => {
    setVolume(values[0] / 100);
  };

  return (
    <footer className="bg-spotify-gray border-t border-spotify-light-gray p-4 h-20">
      <div className="flex items-center justify-between h-full">
        {/* Currently Playing */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="w-14 h-14 bg-spotify-light-gray rounded flex items-center justify-center">
            <img 
              src={`https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=56&h=56&fit=crop`}
              alt="Album cover"
              className="w-14 h-14 rounded object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate text-spotify-white">{currentTrack.title}</p>
            <p className="text-xs text-spotify-text truncate">{currentTrack.artist}</p>
          </div>
          <Button variant="ghost" size="sm" className="text-spotify-text hover:text-spotify-white">
            <Heart className="w-4 h-4" />
          </Button>
        </div>

        {/* Player Controls */}
        <div className="flex flex-col items-center space-y-2 flex-1 max-w-md">
          {/* Control Buttons */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-spotify-text hover:text-spotify-white">
              <Shuffle className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-spotify-text hover:text-spotify-white"
              onClick={previous}
            >
              <SkipBack className="w-5 h-5" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="w-8 h-8 bg-spotify-white text-black rounded-full hover:scale-105 transition-transform duration-200"
              onClick={toggle}
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
              className="text-spotify-text hover:text-spotify-white"
              onClick={next}
            >
              <SkipForward className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" className="text-spotify-text hover:text-spotify-white">
              <Repeat className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="flex items-center space-x-2 w-full">
            <span className="text-xs text-spotify-text">{formatTime(currentTime)}</span>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={handleProgressChange}
              className="flex-1"
            />
            <span className="text-xs text-spotify-text">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume & Options */}
        <div className="flex items-center space-x-3 flex-1 justify-end">
          <Button variant="ghost" size="sm" className="text-spotify-text hover:text-spotify-white">
            <List className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-spotify-text hover:text-spotify-white">
            <Monitor className="w-4 h-4" />
          </Button>
          <div className="flex items-center space-x-2 group">
            <Button variant="ghost" size="sm" className="text-spotify-text hover:text-spotify-white">
              <Volume2 className="w-4 h-4" />
            </Button>
            <Slider
              value={[volume * 100]}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="w-20"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
