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
    <ul className="rounded-lg overflow-hidden divide-y divide-spotify-black divide-opacity-10">
      {tracks.map((track, index) => {
        const isCurrentTrack = currentTrack?.id === track.id;
        return (
          <li
            key={track.id}
            className={
              `flex items-center gap-3 px-4 py-2 cursor-pointer group transition-colors duration-200 hover:bg-spotify-black hover:bg-opacity-50 ${isCurrentTrack ? 'bg-spotify-green bg-opacity-10' : ''}`
            }
            onClick={() => handlePlayTrack(track)}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded flex items-center justify-center overflow-hidden">
              <img 
                src={`https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=40&h=40&fit=crop`}
                alt="Track cover"
                className="w-8 h-8 object-cover rounded"
              />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className={`truncate font-medium text-spotify-white group-hover:text-spotify-green ${isCurrentTrack ? 'text-spotify-green' : ''}`}>{track.title}</span>
              <span className="text-xs text-spotify-text truncate">{track.artist}</span>
            </div>
            <span className="text-xs text-spotify-text ml-auto">{formatTime(track.duration)}</span>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 hover:text-spotify-white transition-all duration-200"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
