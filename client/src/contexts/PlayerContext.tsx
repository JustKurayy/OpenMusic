import { createContext, useContext, useState, useRef, useEffect } from "react";
import { tracksApi, type ApiTrack } from "@/lib/api";

interface PlayerContextType {
  currentTrack: ApiTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  queue: ApiTrack[];
  currentIndex: number;
  
  // Actions
  playTrack: (track: ApiTrack, queue?: ApiTrack[]) => void;
  pause: () => void;
  resume: () => void;
  toggle: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  next: () => void;
  previous: () => void;
  addToQueue: (track: ApiTrack) => void;
  removeFromQueue: (index: number) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<ApiTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.7);
  const [queue, setQueue] = useState<ApiTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;
    
    const audio = audioRef.current;
    
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };
    
    const handleEnded = () => {
      next();
    };
    
    const handleError = (e: any) => {
      console.error("Audio error:", e);
      setIsPlaying(false);
    };
    
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.pause();
    };
  }, []);

  // Update time tracking
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(audioRef.current!.currentTime);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying]);

  const playTrack = (track: ApiTrack, newQueue?: ApiTrack[]) => {
    if (!audioRef.current) return;
    
    setCurrentTrack(track);
    
    if (newQueue) {
      setQueue(newQueue);
      const index = newQueue.findIndex(t => t.id === track.id);
      setCurrentIndex(index >= 0 ? index : 0);
    }
    
    audioRef.current.src = tracksApi.getStreamUrl(track.id);
    audioRef.current.load();
    
    audioRef.current.play().then(() => {
      setIsPlaying(true);
    }).catch((error) => {
      console.error("Error playing track:", error);
    });
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resume = () => {
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((error) => {
        console.error("Error resuming track:", error);
      });
    }
  };

  const toggle = () => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const setVolume = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
  };

  const next = () => {
    if (queue.length === 0 || currentIndex >= queue.length - 1) return;
    
    const nextTrack = queue[currentIndex + 1];
    setCurrentIndex(currentIndex + 1);
    playTrack(nextTrack);
  };

  const previous = () => {
    if (queue.length === 0 || currentIndex <= 0) return;
    
    const prevTrack = queue[currentIndex - 1];
    setCurrentIndex(currentIndex - 1);
    playTrack(prevTrack);
  };

  const addToQueue = (track: ApiTrack) => {
    setQueue(prev => [...prev, track]);
  };

  const removeFromQueue = (index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
    
    if (index < currentIndex) {
      setCurrentIndex(prev => prev - 1);
    } else if (index === currentIndex && queue.length > 1) {
      // If removing current track, play next or previous
      const nextTrack = queue[index + 1] || queue[index - 1];
      if (nextTrack) {
        playTrack(nextTrack);
      }
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        queue,
        currentIndex,
        playTrack,
        pause,
        resume,
        toggle,
        seekTo,
        setVolume,
        next,
        previous,
        addToQueue,
        removeFromQueue,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}
