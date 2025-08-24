import { usePlayer } from "@/contexts/PlayerContext";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { playlistsApi } from "@/lib/api";
import { useEffect } from "react";
import { X, Clock, MoreHorizontal, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function QueueDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; track: any } | null>(null);
  const { queue, currentTrack, currentIndex, isPlaying, playTrack } = usePlayer();
  const [hoveredTrack, setHoveredTrack] = useState<number | null>(null);

  // Always open by default
  if (!isOpen) return null;
  if (!queue.length) return null;

  const upcomingTracks = queue.slice(currentIndex + 1);
  const hasUpcoming = upcomingTracks.length > 0;

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <aside className="h-full w-80 popofffront z-40 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between sticky top-0 z-10">
        <h2 className="font-bold text-lg text-white">Queue</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-8 h-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Queue Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Now Playing Section */}
        {currentTrack && (
          <div className="p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Now playing</h3>
            <div className="bg-gray-900 bg-opacity-60 rounded-lg p-3">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img 
                    src={`https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=48&h=48&fit=crop&auto=format&q=80`} 
                    alt="Album cover" 
                    className="w-12 h-12 rounded object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 rounded flex items-center justify-center">
                    {isPlaying ? (
                      <div className="w-3 h-3 flex items-center justify-center">
                        <div className="flex space-x-0.5">
                          <div className="w-0.5 h-3 bg-green-500 animate-pulse"></div>
                          <div className="w-0.5 h-2 bg-green-500 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-0.5 h-3 bg-green-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-0.5 h-1 bg-green-500 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                        </div>
                      </div>
                    ) : (
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm truncate">{currentTrack.title}</p>
                  <p className="text-xs text-gray-400 truncate hover:underline cursor-pointer">
                    {currentTrack.artist}
                  </p>
                </div>
                <div className="text-xs text-gray-400">
                  3:45
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Next from Queue Section */}
        {hasUpcoming && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">
                Next from: {queue.length > 1 ? 'Playlist' : 'Track'}
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-400 hover:text-white text-xs"
              >
                Clear queue
              </Button>
            </div>
            
            <div className="space-y-1">
              {upcomingTracks.map((track, index) => (
                <div
                  key={`${track.id}-${index}`}
                  className="group flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-900 hover:bg-opacity-60 cursor-pointer transition-all duration-200"
                  onClick={() => playTrack(track, queue)}
                  onMouseEnter={() => setHoveredTrack(index)}
                  onMouseLeave={() => setHoveredTrack(null)}
                  onContextMenu={e => {
                    e.preventDefault();
                    setContextMenu({ x: e.clientX, y: e.clientY, track });
                  }}
                >
                  {/* Track Number / Play Button */}
                  <div className="w-8 flex justify-center">
                    {hoveredTrack === index ? (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-6 h-6 p-0 text-white hover:bg-transparent"
                      >
                        <Play className="w-3 h-3 ml-0.5" />
                      </Button>
                    ) : (
                      <span className="text-xs text-gray-400 font-medium">
                        {index + 1}
                      </span>
                    )}
                  </div>
                  {/* Album Art */}
                  <img 
                    src={`https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=40&h=40&fit=crop&auto=format&q=80&seed=${index}`} 
                    alt="Album cover" 
                    className="w-10 h-10 rounded object-cover"
                  />
                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate group-hover:text-white">
                      {track.title}
                    </p>
                    <p className="text-xs text-gray-400 truncate hover:underline cursor-pointer">
                      {track.artist}
                    </p>
                  </div>
                  {/* Duration & More Options */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">
                      {formatDuration(180 + (index * 15))}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-6 h-6 p-0 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      {/* Custom Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          track={contextMenu.track}
          queue={queue}
          onPlay={playTrack}
          onAddToPlaylist={(playlistId, trackId) => {
            playlistsApi.addTrack(playlistId, trackId);
          }}
          onDelete={trackId => {
            import("@/lib/api").then(({ tracksApi }) => {
              tracksApi.delete(trackId);
            });
          }}
          onClose={() => setContextMenu(null)}
        />
      )}
      </div>
    </aside>
  );
}
