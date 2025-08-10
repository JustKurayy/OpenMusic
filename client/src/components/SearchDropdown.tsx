import { useQuery } from "@tanstack/react-query";
import { tracksApi } from "@/lib/api";
import { usePlayer } from "@/contexts/PlayerContext";

export default function SearchDropdown({ query }: { query: string }) {
  const { data: tracks = [], isLoading } = useQuery({
    queryKey: ["/api/tracks", { search: query }],
    queryFn: async () => {
      if (!query) return [];
      const res = await fetch(`/api/tracks?search=${encodeURIComponent(query)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tracks");
      return res.json();
    },
    enabled: !!query,
  });
  const { playTrack } = usePlayer();

  // TODO: Add recent searches logic

  return (
    <div className="absolute left-0 right-0 mt-2 bg-spotify-gray rounded-lg shadow-lg z-30 p-4 max-h-96 overflow-y-auto">
      <div className="mb-2 text-xs text-spotify-text font-semibold">Recent searches</div>
      {/* TODO: Render recent searches here */}
      <div className="mb-2 text-xs text-spotify-text font-semibold">Songs</div>
      {isLoading && <div className="text-spotify-text">Loading...</div>}
      {tracks.length === 0 && !isLoading && <div className="text-spotify-text">No results found.</div>}
      {tracks.map((track: any) => (
        <div
          key={track.id}
          className="flex items-center gap-3 p-2 rounded hover:bg-spotify-light-gray cursor-pointer"
          onMouseDown={() => playTrack(track, tracks)}
        >
          <img src={`https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=40&h=40&fit=crop`} alt="cover" className="w-8 h-8 rounded" />
          <div>
            <div className="font-medium text-spotify-white">{track.title}</div>
            <div className="text-xs text-spotify-text">{track.artist}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
