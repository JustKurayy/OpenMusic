import { useQuery } from "@tanstack/react-query";
import { tracksApi, type ApiTrack } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import TrackList from "@/components/TrackList";

export default function Library() {
  const { user } = useAuth();

  const { data: tracks = [], isLoading } = useQuery<ApiTrack[]>({
    queryKey: ["/api/tracks", "my"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-spotify-light-gray rounded w-48 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-spotify-light-gray rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <section>
        <h1 className="text-3xl font-bold mb-6 text-spotify-white">Your Library</h1>
        
        {tracks.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2 text-spotify-white">No music in your library</h3>
            <p className="text-spotify-text mb-6">Upload your first track to get started</p>
            <a 
              href="/upload"
              className="inline-flex items-center px-6 py-3 bg-spotify-green text-black font-semibold rounded-full hover:bg-spotify-green-hover transition-colors duration-200"
            >
              Upload Music
            </a>
          </div>
        ) : (
          <TrackList tracks={tracks} />
        )}
      </section>
    </div>
  );
}
