import { useQuery } from "@tanstack/react-query";
import { tracksApi, type ApiTrack } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayer } from "@/contexts/PlayerContext";
import { Play, Clock, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export default function Home() {
  const { user } = useAuth();
  const { playTrack } = usePlayer();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const { data: allTracks = [], isLoading } = useQuery<ApiTrack[]>({
    queryKey: ["/api/tracks"],
  });

  const { data: myTracks = [] } = useQuery<ApiTrack[]>({
    queryKey: ["/api/tracks", "my"],
    enabled: !!user,
  });

  const recentTracks = allTracks.slice(0, 6);
  const discoverTracks = allTracks.slice(6, 12);
  const quickAccessItems = myTracks.slice(0, 6);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handlePlayTrack = (track: ApiTrack) => {
    playTrack(track, allTracks);
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-900 to-black">
        <div className="p-6 animate-pulse">
          <div className="h-10 bg-gray-700 rounded w-48 mb-2"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="h-8 bg-gray-700 rounded w-64 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-square bg-gray-700 rounded-md"></div>
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-900 to-black min-h-screen">
      <div className="px-6 pt-6 pb-4">
        {/* Greeting Section */}
        <section className="mb-8">
          <h1 className="text-3xl font-bold mb-8 text-white">
            {getGreeting()}
          </h1>

          {/* Quick Access Grid */}
          {user && quickAccessItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
              {quickAccessItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center bg-white bg-opacity-10 hover:bg-opacity-20 rounded-md transition-all duration-200 cursor-pointer group overflow-hidden h-20"
                  onClick={() => handlePlayTrack(item)}
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-400 flex items-center justify-center flex-shrink-0">
                    {index === 0 ? (
                      <Heart className="w-8 h-8 text-white fill-current" />
                    ) : (
                      <div className="w-8 h-8 bg-white bg-opacity-20 rounded"></div>
                    )}
                  </div>
                  <div className="px-4 flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">
                      {item.title}
                    </p>
                    <p className="text-gray-300 text-xs truncate">
                      {item.artist}
                    </p>
                  </div>
                  <div className="pr-4">
                    <Button
                      size="sm"
                      className="w-12 h-12 bg-green-500 hover:bg-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-105 flex items-center justify-center shadow-lg"
                    >
                      <Play className="w-5 h-5 text-black ml-0.5 fill-current" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recently Played Section */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Recently played</h2>
            <Button 
              variant="ghost" 
              className="text-gray-300 hover:text-white text-sm font-semibold hover:bg-transparent"
            >
              Show all
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            {recentTracks.map((track, index) => (
              <div
                key={track.id}
                className="bg-gray-900 bg-opacity-40 hover:bg-opacity-60 rounded-lg p-4 cursor-pointer group transition-all duration-200 hover:scale-105 relative"
                onClick={() => handlePlayTrack(track)}
              >
                <div className="relative mb-4">
                  <img 
                    src={`https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop&auto=format&q=80&seed=${index}`}
                    alt="Album cover"
                    className="w-full aspect-square rounded-lg object-cover shadow-lg"
                  />
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
                  <p className="text-xs text-gray-400 truncate hover:underline cursor-pointer">
                    {track.artist}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Made For You / Discover Section */}
        {discoverTracks.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Made for you</h2>
              <Button 
                variant="ghost" 
                className="text-gray-300 hover:text-white text-sm font-semibold hover:bg-transparent"
              >
                Show all
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
              {discoverTracks.map((track, index) => (
                <div
                  key={track.id}
                  className="bg-gray-900 bg-opacity-40 hover:bg-opacity-60 rounded-lg p-4 cursor-pointer group transition-all duration-200 hover:scale-105 relative"
                  onClick={() => handlePlayTrack(track)}
                >
                  <div className="relative mb-4">
                    <img 
                      src={`https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&auto=format&q=80&seed=${index + 10}`}
                      alt="Album cover"
                      className="w-full aspect-square rounded-lg object-cover shadow-lg"
                    />
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
                    <p className="text-xs text-gray-400 truncate hover:underline cursor-pointer">
                      {track.artist}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recently Played Artists */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Recently played artists</h2>
            <Button 
              variant="ghost" 
              className="text-gray-300 hover:text-white text-sm font-semibold hover:bg-transparent"
            >
              Show all
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 gap-6">
            {allTracks.slice(0, 7).map((track, index) => (
              <div
                key={`artist-${track.id}`}
                className="bg-gray-900 bg-opacity-40 hover:bg-opacity-60 rounded-lg p-4 cursor-pointer group transition-all duration-200 hover:scale-105 relative text-center"
                onClick={() => handlePlayTrack(track)}
              >
                <div className="relative mb-4">
                  <img 
                    src={`https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&auto=format&q=80&seed=${index + 20}`}
                    alt="Artist"
                    className="w-full aspect-square rounded-full object-cover shadow-lg mx-auto"
                  />
                  <Button
                    size="sm"
                    className="absolute bottom-2 right-2 w-12 h-12 bg-green-500 hover:bg-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-105 flex items-center justify-center shadow-lg translate-y-2 group-hover:translate-y-0"
                  >
                    <Play className="w-5 h-5 text-black ml-0.5 fill-current" />
                  </Button>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm text-white truncate group-hover:text-green-400 transition-colors duration-200">
                    {track.artist}
                  </h3>
                  <p className="text-xs text-gray-400 truncate">
                    Artist
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}