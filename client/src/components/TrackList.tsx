import { Clock, MoreHorizontal, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/contexts/PlayerContext";
import type { ApiTrack } from "@/lib/api";

interface TrackListProps {
  tracks: ApiTrack[];
  showHeader?: boolean;
  showAlbum?: boolean;
  showDateAdded?: boolean;
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return "Today";
  if (diffDays === 2) return "Yesterday";
  if (diffDays <= 7) return `${diffDays} days ago`;
  if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  
  return date.toLocaleDateString();
}

export default function TrackList({ 
  tracks, 
  showHeader = true, 
  showAlbum = true, 
  showDateAdded = true 
}: TrackListProps) {
  const { playTrack, currentTrack, isPlaying } = usePlayer();

  const handlePlayTrack = (track: ApiTrack) => {
    playTrack(track, tracks);
  };

  if (tracks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-spotify-text text-lg">No tracks found</p>
      </div>
    );
  }

  return (
    <div className="bg-spotify-light-gray rounded-lg overflow-hidden">
      {/* Table Header */}
      {showHeader && (
        <div className="px-6 py-3 border-b border-spotify-black border-opacity-20 grid grid-cols-12 gap-4 text-xs text-spotify-text font-medium uppercase tracking-wider">
          <div className="col-span-1">#</div>
          <div className="col-span-5">Title</div>
          {showAlbum && <div className="col-span-3">Album</div>}
          {showDateAdded && <div className="col-span-2">Date added</div>}
          <div className="col-span-1 text-center">
            <Clock className="w-4 h-4 mx-auto" />
          </div>
        </div>
      )}
      
      {/* Track Rows */}
      {tracks.map((track, index) => {
        const isCurrentTrack = currentTrack?.id === track.id;
        
        return (
          <div
            key={track.id}
            className="px-6 py-3 hover:bg-spotify-black hover:bg-opacity-50 grid grid-cols-12 gap-4 items-center group cursor-pointer transition-colors duration-200"
            onClick={() => handlePlayTrack(track)}
          >
            <div className="col-span-1 text-spotify-text group-hover:text-spotify-white">
              {isCurrentTrack && isPlaying ? (
                <div className="w-4 h-4 flex items-center justify-center">
                  <div className="flex space-x-0.5">
                    <div className="w-0.5 h-3 bg-spotify-green animate-pulse"></div>
                    <div className="w-0.5 h-2 bg-spotify-green animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-0.5 h-4 bg-spotify-green animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              ) : (
                <>
                  <span className="group-hover:hidden">{index + 1}</span>
                  <Play className="w-4 h-4 hidden group-hover:inline spotify-green" />
                </>
              )}
            </div>
            
            <div className="col-span-5 flex items-center space-x-3">
              <div className="w-10 h-10 bg-spotify-gray rounded overflow-hidden">
                <img 
                  src={`https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=40&h=40&fit=crop`}
                  alt="Track cover"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className={`font-medium transition-colors duration-200 ${
                  isCurrentTrack ? 'spotify-green' : 'text-spotify-white group-hover:spotify-green'
                }`}>
                  {track.title}
                </p>
                <p className="text-sm text-spotify-text">{track.artist}</p>
              </div>
            </div>
            
            {showAlbum && (
              <div className="col-span-3 text-spotify-text">
                {track.album || "Single"}
              </div>
            )}
            
            {showDateAdded && (
              <div className="col-span-2 text-spotify-text">
                {formatDate(track.createdAt)}
              </div>
            )}
            
            <div className="col-span-1 text-center text-spotify-text">
              <span>{formatTime(track.duration)}</span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 opacity-0 group-hover:opacity-100 hover:text-spotify-white transition-all duration-200"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
