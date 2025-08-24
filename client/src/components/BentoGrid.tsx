import React, { useState, useRef } from 'react';
import { useQuery } from "@tanstack/react-query";
import { tracksApi, type ApiTrack } from "@/lib/api";
import { playlistsApi, type ApiPlaylist } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayer } from "@/contexts/PlayerContext";
import { Play, Clock, Heart, Music, TrendingUp, Star, Users, Mic2, ChevronLeft, ChevronRight, MoreHorizontal, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface BentoGridProps {
  tracks: ApiTrack[];
  onTrackClick: (track: ApiTrack) => void;
}

export default function BentoGrid({ tracks, onTrackClick }: BentoGridProps) {
  const { user } = useAuth();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (gridRef.current) {
      const rect = gridRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  // Fetch user's playlists
  const { data: userPlaylists = [] } = useQuery<ApiPlaylist[]>({
    queryKey: ["/api/playlists"],
    enabled: !!user,
  });

  // Get recent tracks (last 8 uploaded)
  const recentTracks = tracks.slice(0, 8);
  
  // Get user's playlists (limit to 8)
  const userPlaylistsLimited = userPlaylists.slice(0, 8);

  // Get recently played tracks (simulate from tracks array)
  const recentlyPlayedTracks = tracks.slice(8, 16);

  // Mock data for different sections - commented out as requested
  /*
  const madeForYouItems = [
    { id: 1, title: "Discover Weekly", subtitle: "Your weekly mixtape of fresh music", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop&auto=format&q=80&seed=1", type: "playlist" },
    { id: 2, title: "Daily Mix 1", subtitle: "Linkin Park, System Of A Down, Coal Chamber...", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&auto=format&q=80&seed=2", type: "playlist" },
    { id: 3, title: "Daily Mix 2", subtitle: "Avril Lavigne, Lorde, Charli XCX and more", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop&auto=format&q=80&seed=3", type: "playlist" },
    { id: 4, title: "Daily Mix 3", subtitle: "The Strokes, Martin Garrix, MGMT and more", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&auto=format&q=80&seed=4", type: "playlist" },
    { id: 5, title: "Daily Mix 4", subtitle: "Chuck Berry, Elvis Presley, Roy Orbison and more", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop&auto=format&q=80&seed=5", type: "playlist" },
    { id: 6, title: "Daily Mix 5", subtitle: "Frank Sinatra, Gerhard Trede, Dean Martin and more", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&auto=format&q=80&seed=6", type: "playlist" },
    { id: 7, title: "Nirvana Radio", subtitle: "The Strokes, Martin Garrix, MGMT and more", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop&auto=format&q=80&seed=7", type: "radio" },
    { id: 8, title: "Fall Out Boy Radio", subtitle: "With Panic! At The Disco, The All-American Rejects,...", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop&auto=format&q=80&seed=8", type: "radio" },
  ];

  const topMixesItems = [
    { id: 9, title: "Rock Mix", subtitle: "Red Hot Chili Peppers, R.E.M., Guns N' Roses...", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop&auto=format&q=80&seed=9", color: "green" },
    { id: 10, title: "Chill Mix", subtitle: "MF DOOM, Daft Punk, The Chainsmokers, and more", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&auto=format&q=80&seed=10", color: "yellow" },
    { id: 11, title: "Pop Mix", subtitle: "Red Hot Chili Peppers, R.E.M., Guns N' Roses...", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop&auto=format&q=80&seed=11", color: "lightblue" },
    { id: 12, title: "Daft Punk Mix", subtitle: "Daft Punk, MGMT, Muse, and more", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&auto=format&q=80&seed=12", color: "purple" },
    { id: 13, title: "Happy Mix", subtitle: "The Turtles, Van Morrison, ABBA and more", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop&auto=format&q=80&seed=13", color: "pink" },
    { id: 14, title: "David Bowie Mix", subtitle: "Soft Cell, The Who and The Clash", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&auto=format&q=80&seed=14", color: "yellow" },
    { id: 15, title: "Upbeat Mix", subtitle: "Kylie Minogue, Charli XCX, Cage The Elephant and...", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop&auto=format&q=80&seed=15", color: "green" },
    { id: 16, title: "60s Mix", subtitle: "Chuck Berry, Skeeter David, Van Morrison and...", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&auto=format&q=80&seed=16", color: "magenta" },
  ];

  const favoriteArtistsItems = [
    { id: 17, title: "Guns N' Roses", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&auto=format&q=80&seed=17" },
    { id: 18, title: "MF DOOM", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop&auto=format&q=80&seed=18" },
    { id: 19, title: "David Bowie", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&auto=format&q=80&seed=19" },
    { id: 20, title: "Nirvana", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop&auto=format&q=80&seed=20" },
    { id: 21, title: "The Strokes", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&auto=format&q=80&seed=21" },
    { id: 22, title: "Daft Punk", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop&auto=format&q=80&seed=22" },
  ];
  */

  return (
    <div
      ref={gridRef}
      className="relative p-6 min-h-screen bg-black"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Animated background lighting effect */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
          isHovering ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(120, 119, 198, 0.15), transparent 40%)`,
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 space-y-8">
        {/* Greeting */}
        <div className="pt-4">
          <h1 className="text-3xl font-bold text-white mb-8">
            {getGreeting()}{user?.name ? `, ${user.name}` : ''}
          </h1>
        </div>

        {/* Recently Uploaded Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Recently Uploaded</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-gray-400 hover:text-white">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-gray-400 hover:text-white">
                <ChevronRight className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-gray-400 hover:text-white">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth pl-1">
            {recentTracks.map((track, index) => (
              <div
                key={track.id}
                className="flex-shrink-0 w-48 bg-gray-900 bg-opacity-40 hover:bg-opacity-60 rounded-lg p-4 cursor-pointer group transition-all duration-200 hover:scale-105 relative"
                onClick={() => onTrackClick(track)}
              >
                <div className="relative mb-4">
                  <img 
                    src={`https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop&auto=format&q=80&seed=${index}`}
                    alt={track.title}
                    className="w-full aspect-square rounded-lg object-cover shadow-lg"
                  />
                  <div className="absolute top-2 left-2 bg-green-500 text-black text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    NEW
                  </div>
                  <Button
                    size="sm"
                    className="absolute bottom-2 right-2 w-12 h-12 bg-green-500 hover:bg-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-105 flex items-center justify-center shadow-lg translate-y-2 group-hover:translate-y-0"
                  >
                    <Play className="w-5 h-5 text-black ml-0.5 fill-current" />
                  </Button>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm text-white truncate group-hover:text-green-400 transition-colors duration-200">
                    {track.title}
                  </h3>
                  <p className="text-xs text-gray-400 truncate">
                    {track.artist}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Uploaded</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Your Playlists Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Your Playlists</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-gray-400 hover:text-white">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-gray-400 hover:text-white">
                <ChevronRight className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-gray-400 hover:text-white">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth pl-1">
            {userPlaylistsLimited.map((playlist, index) => (
              <div
                key={playlist.id}
                className="flex-shrink-0 w-48 bg-gray-900 bg-opacity-40 hover:bg-opacity-60 rounded-lg p-4 cursor-pointer group transition-all duration-200 hover:scale-105 relative"
                onClick={() => onTrackClick(tracks[0] || { id: 1, title: playlist.name, artist: "Playlist" } as any)}
              >
                <div className="relative mb-4">
                  <div className="relative">
                    <img 
                      src={playlist.coverImage || `https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop&auto=format&q=80&seed=${index + 100}`}
                      alt={playlist.name}
                      className="w-full aspect-square rounded-lg object-cover shadow-lg"
                    />
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                      style={{ backgroundColor: `hsl(${(index * 45) % 360}, 70%, 60%)` }}
                    />
                  </div>
                  <Button
                    size="sm"
                    className="absolute bottom-2 right-2 w-12 h-12 bg-green-500 hover:bg-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-105 flex items-center justify-center shadow-lg translate-y-2 group-hover:translate-y-0"
                  >
                    <Play className="w-5 h-5 text-black ml-0.5 fill-current" />
                  </Button>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm text-white truncate group-hover:text-green-400 transition-colors duration-200">
                    {playlist.name}
                  </h3>
                  <p className="text-xs text-gray-400 truncate">
                    {playlist.description || "Your curated collection"}
                  </p>
                                     <div className="flex items-center justify-between">
                     <span className="text-xs text-gray-500">0 songs</span>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recently Played Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Recently Played</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-gray-400 hover:text-white">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-gray-400 hover:text-white">
                <ChevronRight className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-gray-400 hover:text-white">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth pl-1">
            {recentlyPlayedTracks.map((track, index) => (
              <div
                key={track.id}
                className="flex-shrink-0 w-48 bg-gray-900 bg-opacity-40 hover:bg-opacity-60 rounded-lg p-4 cursor-pointer group transition-all duration-200 hover:scale-105 relative"
                onClick={() => onTrackClick(track)}
              >
                <div className="relative mb-4">
                  <img 
                    src={`https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&auto=format&q=80&seed=${index + 200}`}
                    alt={track.title}
                    className="w-full aspect-square rounded-lg object-cover shadow-lg"
                  />
                  <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    PLAYED
                  </div>
                  <Button
                    size="sm"
                    className="absolute bottom-2 right-2 w-12 h-12 bg-green-500 hover:bg-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-105 flex items-center justify-center shadow-lg translate-y-2 group-hover:translate-y-0"
                  >
                    <Play className="w-5 h-5 text-black ml-0.5 fill-current" />
                  </Button>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm text-white truncate group-hover:text-green-400 transition-colors duration-200">
                    {track.title}
                  </h3>
                  <p className="text-xs text-gray-400 truncate">
                    {track.artist}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Recently played</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Made For You Section - Commented out as requested */}
        {/*
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Made For You</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-gray-400 hover:text-white">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-gray-400 hover:text-white">
                <ChevronRight className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-gray-400 hover:text-white">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth pl-1">
            {madeForYouItems.map((item) => (
              <div
                key={item.id}
                className="flex-shrink-0 w-48 bg-gray-900 bg-opacity-40 hover:bg-opacity-60 rounded-lg p-4 cursor-pointer group transition-all duration-200 hover:scale-105 relative"
                onClick={() => onTrackClick(tracks[0] || { id: 1, title: item.title, artist: "Various Artists" } as any)}
              >
                <div className="relative mb-4">
                  <img 
                    src={item.image}
                    alt={item.title}
                    className="w-full aspect-square rounded-lg object-cover shadow-lg"
                  />
                  {item.type === "radio" && (
                    <div className="absolute top-2 left-2 bg-white text-black text-xs font-bold px-2 py-1 rounded">
                      RADIO
                    </div>
                  )}
                  <Button
                    size="sm"
                    className="absolute bottom-2 right-2 w-12 h-12 bg-green-500 hover:bg-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-105 flex items-center justify-center shadow-lg translate-y-2 group-hover:translate-y-0"
                  >
                    <Play className="w-5 h-5 text-black ml-0.5 fill-current" />
                  </Button>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm text-white truncate group-hover:text-green-400 transition-colors duration-200">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-400 truncate">
                    {item.subtitle}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">50</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        */}
      </div>
    </div>
  );
}
