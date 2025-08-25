import React, { useEffect, useState, useRef } from 'react';
import { usePlayer } from "@/contexts/PlayerContext";
import { Loader2, Music } from "lucide-react";

interface LyricsLine {
    time: number;
    text: string;
}

export default function Lyrics() {
    const { currentTrack, currentTime, lyrics, lyricsLoading, lyricsError, seekTo } = usePlayer();
    const [backgroundColor, setBackgroundColor] = useState<string>('');
    const [currentLineIndex, setCurrentLineIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const currentLineRef = useRef<HTMLDivElement>(null);

    // Generate a random solid background color with good contrast
    useEffect(() => {
        if (currentTrack) {
            // Pick a random hue, keep saturation and lightness for contrast
            const hue = Math.floor(Math.random() * 360);
            const saturation = 60 + Math.floor(Math.random() * 20); // 60-80%
            const lightness = 25 + Math.floor(Math.random() * 20); // 25-45%
            const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            setBackgroundColor(color);
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
            className="relative h-full overflow-hidden font-[Inter,sans-serif]"
            style={{ background: backgroundColor }}
        >
            {/* Overlay for better text contrast, but no gradient */}
            <div className="absolute inset-0 bg-black bg-opacity-30"></div>

            {/* Lyrics container */}
            <div
                ref={containerRef}
                className="relative z-10 p-12 h-full overflow-y-auto scrollbar-hide text-left"
            >
                <div className="space-y-6">
                    {lyrics.map((line, index) => (
                        <div
                            key={index}
                            ref={index === currentLineIndex ? currentLineRef : null}
                            className="transition-all duration-200 cursor-pointer select-none font-bold text-3xl md:text-4xl lg:text-5xl"
                            style={{
                                fontFamily: 'Inter, sans-serif',
                                textAlign: 'left',
                                paddingLeft: '0.5rem',
                                borderRadius: '0.375rem',
                                color: 'rgba(255,255,255,' + (index === currentLineIndex ? '1' : '0.7') + ')',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.textDecoration = 'underline';
                                e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.textDecoration = '';
                                e.currentTarget.style.color = 'rgba(255,255,255,' + (index === currentLineIndex ? '1' : '0.7') + ')';
                            }}
                            onClick={e => {
                                if (currentTrack && line.time !== undefined) {
                                    // Seek to the time of the clicked line
                                    seekTo(line.time);
                                }
                            }}
                        >
                            {line.text}
                        </div>
                    ))}
                    <p style={{
                        paddingLeft: '0.5rem',
                        borderRadius: '0.375rem',
                        color: 'rgba(255,255,255)',
                    }}>Lyrics provided by LRCLib</p>
                </div>
                {/* Spacer at the bottom for better scrolling */}
                <div className="h-32"></div>
            </div>
        </div>
    );
}
