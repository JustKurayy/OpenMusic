import { useEffect, useRef } from "react";
import { usePlayer } from "@/contexts/PlayerContext";

export default function AudioPlayer() {
  const { currentTrack } = usePlayer();
  const audioRef = useRef<HTMLAudioElement>(null);

  // This component is mainly for the HTML5 audio element
  // The actual player logic is handled in PlayerContext
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      // Audio element is managed by PlayerContext
      // This component can be used for additional audio-related functionality if needed
    }
  }, [currentTrack]);

  return (
    <audio
      ref={audioRef}
      preload="metadata"
      className="hidden"
    />
  );
}
