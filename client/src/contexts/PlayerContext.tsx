import { createContext, useContext, useState, useRef, useEffect } from "react";
// Fix for window.lyricsCache typing
declare global {
  interface Window {
    lyricsCache?: { [key: string]: any };
  }
}
import { tracksApi, type ApiTrack } from "@/lib/api";
import { lyricsApi } from "@/lib/api";

interface LyricsLine {
  time: number;
  text: string;
}

interface PlayerContextType {
  playRadio?: (radio: any) => void;
  // Radio playback
  currentRadio?: any;
  isRadioPlaying?: boolean;
  setCurrentRadio?: (radio: any) => void;
  toggleRadio?: () => void;
  currentTrack: ApiTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  queue: ApiTrack[];
  currentIndex: number;
  showLyrics: boolean;
  lyrics: LyricsLine[];
  lyricsLoading: boolean;
  lyricsError: string | null;
  
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
  toggleLyrics: () => void;
  fetchLyrics: (title: string, artist: string) => Promise<void>;
  setRadioVolume?: (volume: number) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  // Set radio volume helper
  const setRadioVolume = (volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    if (radioAudioRef.current) {
      radioAudioRef.current.volume = clamped;
    }
    setVolumeState(clamped);
  };
  // Play radio helper
  const playRadio = (radio: any) => {
    setCurrentRadio(radio);
    setIsRadioPlaying(true);
  };
  // Radio playback state
  const [currentRadio, setCurrentRadio] = useState<any | null>(null);
  const [isRadioPlaying, setIsRadioPlaying] = useState(false);
  const radioAudioRef = useRef<HTMLAudioElement | null>(null);
  // Radio audio element
  useEffect(() => {
    if (!radioAudioRef.current) {
      radioAudioRef.current = new Audio();
    }
    return () => {
      radioAudioRef.current?.pause();
    };
  }, []);

  // Sync radio audio element volume with context volume
  useEffect(() => {
    if (currentRadio && radioAudioRef.current) {
      radioAudioRef.current.src = currentRadio.urlResolved;
      radioAudioRef.current.load();
      radioAudioRef.current.volume = volume;
      if (isRadioPlaying) {
        radioAudioRef.current.play();
      } else {
        radioAudioRef.current.pause();
      }
    } else if (radioAudioRef.current) {
      radioAudioRef.current.pause();
    }
  }, [currentRadio, isRadioPlaying]);

  const toggleRadio = () => {
    if (!currentRadio) return;
    setIsRadioPlaying(prev => {
      if (radioAudioRef.current) {
        if (prev) {
          radioAudioRef.current.pause();
        } else {
          radioAudioRef.current.play();
        }
      }
      return !prev;
    });
  };
  const [currentTrack, setCurrentTrack] = useState<ApiTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.2);
  const [queue, setQueue] = useState<ApiTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState<LyricsLine[]>([]);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsError, setLyricsError] = useState<string | null>(null);
  
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

    // Stop radio playback if active
    if (radioAudioRef.current) {
      radioAudioRef.current.pause();
    }
    setCurrentRadio(null);
    setIsRadioPlaying(false);

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

    // Fetch lyrics for the new track
    if (showLyrics) {
      fetchLyrics(track.title, track.artist);
    }
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

  const toggleLyrics = () => {
    const newShowLyrics = !showLyrics;
    setShowLyrics(newShowLyrics);
    
    if (newShowLyrics && currentTrack) {
      fetchLyrics(currentTrack.title, currentTrack.artist);
    }
  };

  const fetchLyrics = async (title: string, artist: string) => {
    setLyricsLoading(true);
    setLyricsError(null);
    // Lyrics cache by track id
    if (!window.lyricsCache) window.lyricsCache = {};
    const cacheKey = `${title}::${artist}`;
    if (window.lyricsCache[cacheKey]) {
      setLyrics(window.lyricsCache[cacheKey]);
      setLyricsLoading(false);
      return;
    }
    try {
      const response = await lyricsApi.getLyrics(title, artist);
      const data = await response.json();
      if (data.lyrics) {
        if (data.synced) {
          // Parse synced lyrics (LRC format)
          const lines = data.lyrics
            .split('\n')
            .filter((line: string) => line.trim() && line.includes('['))
            .map((line: string) => {
              const timeMatch = line.match(/\[(\d{2}):(\d{2})\.(\d{2})\]/);
              if (timeMatch) {
                const minutes = parseInt(timeMatch[1]);
                const seconds = parseInt(timeMatch[2]);
                const centiseconds = parseInt(timeMatch[3]);
                // Offset by 1 second
                const time = Math.max(0, minutes * 60 + seconds + centiseconds / 100 - 1);
                const text = line.replace(/\[.*?\]/g, '').trim();
                return { time, text };
              }
              return null;
            })
            .filter((line: LyricsLine | null) => line !== null) as LyricsLine[];
          window.lyricsCache[cacheKey] = lines;
          setLyrics(lines);
        } else {
          // Plain lyrics - split into lines with estimated timing
          const lines = data.lyrics
            .split('\n')
            .filter((line: string) => line.trim())
            .map((line: string, index: number) => ({
              time: index * 3,
              text: line.trim()
            }));
          window.lyricsCache[cacheKey] = lines;
          setLyrics(lines);
        }
      } else {
        setLyricsError("No lyrics found");
        setLyrics([]);
      }
    } catch (error) {
      console.error("Error fetching lyrics:", error);
      setLyricsError("Failed to load lyrics");
      setLyrics([]);
    } finally {
      setLyricsLoading(false);
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
        showLyrics,
        lyrics,
        lyricsLoading,
        lyricsError,
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
        toggleLyrics,
        fetchLyrics,
        // Radio
        currentRadio,
        isRadioPlaying,
        setCurrentRadio,
        toggleRadio,
        playRadio,
        setRadioVolume,
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
