import { useQuery } from "@tanstack/react-query";
import { tracksApi, type ApiTrack } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayer } from "@/contexts/PlayerContext";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { user } = useAuth();
  const { playTrack } = usePlayer();

  const { data: allTracks = [], isLoading } = useQuery<ApiTrack[]>({
    queryKey: ["/api/tracks"],
  });

  const { data: myTracks = [] } = useQuery<ApiTrack[]>({
    queryKey: ["/api/tracks", "my"],
    enabled: !!user,
  });

  const recentTracks = allTracks.slice(0, 6);
  const quickAccessItems = myTracks.slice(0, 3);

  const handlePlayTrack = (track: ApiTrack) => {
    playTrack(track, allTracks);
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-spotify-light-gray rounded w-48 mb-2"></div>
          <div className="h-4 bg-spotify-light-gray rounded w-64 mb-8"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-0">
      {/* Welcome Section */}
      <section className="mb-8 mt-2">
        <h1 className="text-3xl font-bold mb-2 text-spotify-white">Good evening</h1>
        <p className="text-spotify-text">Welcome back to your music</p>
      </section>

      {/* Recently Played Carousel */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-spotify-white">Recently played</h2>
          <Button variant="ghost" className="text-spotify-text hover:text-spotify-white text-sm font-semibold">Show all</Button>
        </div>
        <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide pb-2">
          {recentTracks.map((track) => (
            <div
              key={track.id}
              className="min-w-[180px] max-w-[180px] bg-spotify-light-gray hover:bg-opacity-80 rounded-lg p-4 cursor-pointer group transition-all duration-200 hover:scale-105 relative flex-shrink-0"
              onClick={() => handlePlayTrack(track)}
            >
              <img 
                src={`https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop`}
                alt="Album cover"
                className="w-full aspect-square rounded-lg object-cover mb-4"
              />
              <div>
                <h3 className="font-semibold text-sm mb-1 truncate group-hover:spotify-green transition-colors duration-200 text-spotify-white">
                  {track.title}
                </h3>
                <p className="text-xs text-spotify-text truncate">{track.artist}</p>
              </div>
              <Button
                size="sm"
                className="absolute bottom-4 right-4 w-10 h-10 bg-spotify-green rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-105 flex items-center justify-center"
              >
                <Play className="w-4 h-4 text-black ml-0.5" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Discover More Carousel */}
      {allTracks.length > 6 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-spotify-white">Discover more</h2>
          </div>
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide pb-2">
            {allTracks.slice(6, 18).map((track) => (
              <div
                key={track.id}
                className="min-w-[180px] max-w-[180px] bg-spotify-light-gray hover:bg-opacity-80 rounded-lg p-4 cursor-pointer group transition-all duration-200 hover:scale-105 relative flex-shrink-0"
                onClick={() => handlePlayTrack(track)}
              >
                <img 
                  src={`https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop`}
                  alt="Album cover"
                  className="w-full aspect-square rounded-lg object-cover mb-4"
                />
                <div>
                  <h3 className="font-semibold text-sm mb-1 truncate group-hover:spotify-green transition-colors duration-200 text-spotify-white">
                    {track.title}
                  </h3>
                  <p className="text-xs text-spotify-text truncate">{track.artist}</p>
                </div>
                <Button
                  size="sm"
                  className="absolute bottom-4 right-4 w-10 h-10 bg-spotify-green rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-105 flex items-center justify-center"
                >
                  <Play className="w-4 h-4 text-black ml-0.5" />
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
