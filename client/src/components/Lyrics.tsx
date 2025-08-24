import React, { useEffect, useState, useRef } from 'react';
import { usePlayer } from "@/contexts/PlayerContext";
import { Loader2, Music } from "lucide-react";

interface LyricsLine {
  time: number;
  text: string;
}

export default function Lyrics() {
  const { currentTrack, currentTime, lyrics, lyricsLoading, lyricsError } = usePlayer();
  const [backgroundColor, setBackgroundColor] = useState<string>('');
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentLineRef = useRef<HTMLDivElement>(null);

  // Generate a random background color when track changes
  useEffect(() => {
    if (currentTrack) {
      const colors = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
        'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
        'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
        'linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)',
        'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
      ];
      
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      setBackgroundColor(randomColor);
    }
  }, [currentTrack]);

  // Update current line based on time
  useEffect(() => {
    if (lyrics.length === 0) return;

    let newIndex = 0;
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].time) {
        newIndex = i;
      } else {
        break;
      }
    }

    if (newIndex !== currentLineIndex) {
      setCurrentLineIndex(newIndex);
    }
  }, [currentTime, lyrics, currentLineIndex]);

  // Auto-scroll to current line
  useEffect(() => {
    if (currentLineRef.current && containerRef.current) {
      const container = containerRef.current;
      const currentLine = currentLineRef.current;
      
      const containerHeight = container.clientHeight;
      const lineTop = currentLine.offsetTop;
      const lineHeight = currentLine.clientHeight;
      
      const scrollTop = lineTop - containerHeight / 2 + lineHeight / 2;
      
      container.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      });
    }
  }, [currentLineIndex]);

  if (!currentTrack) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-center text-gray-400">
          <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No track playing</p>
          <p className="text-sm">Start playing a song to see lyrics</p>
        </div>
      </div>
    );
  }

  if (lyricsLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-center text-gray-400">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
          <p>Loading lyrics...</p>
        </div>
      </div>
    );
  }

  if (lyricsError) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-center text-gray-400">
          <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">No lyrics available</p>
          <p className="text-sm">{lyricsError}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative h-full overflow-hidden"
      style={{ background: backgroundColor }}
    >
      {/* Background overlay for better text contrast */}
      <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      
      {/* Track info header */}
      <div className="relative z-10 p-6 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">
          {currentTrack.title}
        </h1>
        <p className="text-lg text-white text-opacity-80">
          {currentTrack.artist}
        </p>
      </div>

      {/* Lyrics container */}
      <div 
        ref={containerRef}
        className="relative z-10 px-6 pb-6 h-[calc(100%-120px)] overflow-y-auto scrollbar-hide"
      >
        <div className="space-y-6">
          {lyrics.map((line, index) => (
            <div
              key={index}
              ref={index === currentLineIndex ? currentLineRef : null}
              className={`text-center transition-all duration-300 ${
                index === currentLineIndex
                  ? 'text-white text-2xl font-semibold'
                  : index < currentLineIndex
                  ? 'text-white text-opacity-40 text-lg'
                  : 'text-white text-opacity-60 text-lg'
              }`}
            >
              {line.text}
            </div>
          ))}
        </div>
        
        {/* Spacer at the bottom for better scrolling */}
        <div className="h-32"></div>
      </div>
    </div>
  );
}
