import React, { useState, useRef } from 'react';
import { useQuery } from "@tanstack/react-query";
import { tracksApi, type ApiTrack } from "@/lib/api";
import { usePlayer } from "@/contexts/PlayerContext";
import { Play, Search, Music, Mic2, Disc3, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface SearchResultsProps {
  query: string;
  onTrackClick: (track: ApiTrack) => void;
}

export default function SearchResults({ query, onTrackClick }: SearchResultsProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const { data: tracks = [], isLoading } = useQuery<ApiTrack[]>({
    queryKey: ["/api/tracks", { search: query }],
    queryFn: async () => {
      if (!query) return [];
      const res = await fetch(`/api/tracks?search=${encodeURIComponent(query)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tracks");
      return res.json();
    },
    enabled: !!query,
  });

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

  if (isLoading) {
    return (
      <div className="p-6 min-h-screen">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="col-span-1 row-span-1 h-48 bg-gray-800/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!query) {
    return null;
  }

  if (tracks.length === 0) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
          <p className="text-gray-400">Try searching for something else</p>
        </div>
      </div>
    );
  }

  // Group tracks by type for different grid sections
  const songs = tracks.filter(track => track.title.toLowerCase().includes(query.toLowerCase()));
  const artists = tracks.filter(track => track.artist.toLowerCase().includes(query.toLowerCase()));
  const albums = tracks.slice(0, 4); // Simulate albums

  const gridItems = [
    {
      id: 'search-header',
      title: `Search results for "${query}"`,
      subtitle: `${tracks.length} results found`,
      icon: <Search className="w-6 h-6" />,
      gradient: 'from-blue-600 to-purple-600',
      size: 'col-span-4 row-span-1',
      type: 'header'
    },
    {
      id: 'songs',
      title: 'Songs',
      subtitle: `${songs.length} songs found`,
      icon: <Music className="w-6 h-6" />,
      gradient: 'from-green-600 to-emerald-600',
      size: 'col-span-2 row-span-2',
      type: 'tracks',
      tracks: songs.slice(0, 6)
    },
    {
      id: 'artists',
      title: 'Artists',
      subtitle: `${artists.length} artists found`,
      icon: <Mic2 className="w-6 h-6" />,
      gradient: 'from-orange-600 to-red-600',
      size: 'col-span-1 row-span-2',
      type: 'artists',
      tracks: artists.slice(0, 4)
    },
    {
      id: 'albums',
      title: 'Albums',
      subtitle: `${albums.length} albums found`,
      icon: <Disc3 className="w-6 h-6" />,
      gradient: 'from-purple-600 to-pink-600',
      size: 'col-span-1 row-span-2',
      type: 'albums',
      tracks: albums
    }
  ];

  return (
    <div
      ref={gridRef}
      className="relative p-6 min-h-screen"
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
      
      {/* Grid container */}
      <div className="grid grid-cols-4 gap-4 relative z-10">
        {gridItems.map((item) => (
          <Card
            key={item.id}
            className={`${item.size} group relative overflow-hidden bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 hover:border-gray-700/50 transition-all duration-300 hover:scale-[1.02]`}
          >
            {/* Gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
            
            {/* Content */}
            <div className="relative z-10 p-6 h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${item.gradient} text-white`}>
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="text-sm text-gray-400">{item.subtitle}</p>
                </div>
              </div>

              {/* Content based on type */}
              {item.type === 'header' && (
                <div className="flex-1 flex items-center">
                  <div className="text-2xl font-bold text-white">
                    Search results for "{query}"
                  </div>
                </div>
              )}

              {item.type === 'tracks' && item.tracks && (
                <div className="flex-1 space-y-3">
                  {item.tracks.map((track, index) => (
                    <div
                      key={track.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors duration-200 cursor-pointer"
                      onClick={() => onTrackClick(track)}
                    >
                      <div className="relative w-10 h-10 rounded-md overflow-hidden bg-gray-800">
                        <img
                          src={`https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop&auto=format&q=80&seed=${index}`}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                          <Play className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{track.title}</p>
                        <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {item.type === 'artists' && item.tracks && (
                <div className="flex-1 space-y-3">
                  {item.tracks.map((track, index) => (
                    <div
                      key={track.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors duration-200 cursor-pointer"
                      onClick={() => onTrackClick(track)}
                    >
                      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-800">
                        <img
                          src={`https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop&auto=format&q=80&seed=${index + 20}`}
                          alt={track.artist}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{track.artist}</p>
                        <p className="text-xs text-gray-400 truncate">Artist</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {item.type === 'albums' && item.tracks && (
                <div className="flex-1 space-y-3">
                  {item.tracks.map((track, index) => (
                    <div
                      key={track.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors duration-200 cursor-pointer"
                      onClick={() => onTrackClick(track)}
                    >
                      <div className="relative w-10 h-10 rounded-md overflow-hidden bg-gray-800">
                        <img
                          src={`https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop&auto=format&q=80&seed=${index + 30}`}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{track.title}</p>
                        <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hover effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Card>
        ))}
      </div>
    </div>
  );
}
