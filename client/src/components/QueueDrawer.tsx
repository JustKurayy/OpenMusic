import { usePlayer } from "@/contexts/PlayerContext";
import { useQuery } from "@tanstack/react-query";
import { playlistsApi } from "@/lib/api";

export default function QueueDrawer() {
  // TODO: Replace with actual queue state from PlayerContext
  const { queue, currentTrack, currentIndex, isPlaying, playTrack } = usePlayer();
  if (!queue.length) return null;

  return (
    <aside className="fixed right-0 top-0 h-full w-80 bg-spotify-gray border-l border-spotify-light-gray z-40 flex flex-col shadow-xl">
      <div className="p-4 border-b border-spotify-light-gray flex items-center justify-between">
        <div className="font-bold text-lg text-spotify-white">Queue</div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4">
          <div className="text-xs text-spotify-text mb-1">Now playing</div>
          {currentTrack && (
            <div className="flex items-center gap-3 p-2 rounded bg-spotify-light-gray">
              <img src={`https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=40&h=40&fit=crop`} alt="cover" className="w-10 h-10 rounded" />
              <div>
                <div className="font-medium text-spotify-white">{currentTrack.title}</div>
                <div className="text-xs text-spotify-text">{currentTrack.artist}</div>
              </div>
            </div>
          )}
        </div>
        <div>
          <div className="text-xs text-spotify-text mb-1">Next from queue</div>
          {queue.slice(currentIndex + 1).map((track, i) => (
            <div
              key={track.id}
              className="flex items-center gap-3 p-2 rounded hover:bg-spotify-light-gray cursor-pointer"
              onClick={() => playTrack(track, queue)}
            >
              <img src={`https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=40&h=40&fit=crop`} alt="cover" className="w-8 h-8 rounded" />
              <div>
                <div className="font-medium text-spotify-white">{track.title}</div>
                <div className="text-xs text-spotify-text">{track.artist}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
