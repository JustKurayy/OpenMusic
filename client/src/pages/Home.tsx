import { useQuery } from "@tanstack/react-query";
import { tracksApi, type ApiTrack } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayer } from "@/contexts/PlayerContext";
import { useSearch } from "@/contexts/SearchContext";
import BentoGrid from "@/components/BentoGrid";
import SearchResults from "@/components/SearchResults";

export default function Home() {
    const { user } = useAuth();
    const { playTrack } = usePlayer();
    const { query } = useSearch();

    const { data: allTracks = [], isLoading } = useQuery<ApiTrack[]>({
        queryKey: ["/api/tracks"],
    });

    const { data: myTracks = [] } = useQuery<ApiTrack[]>({
        queryKey: ["/api/tracks"],
        enabled: !!user,
    });

    const handlePlayTrack = (track: ApiTrack) => {
        playTrack(track, allTracks);
    };

    if (isLoading) {
        return (
            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-900 to-black">
                <div className="p-6 animate-pulse">
                    <div className="grid grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className="col-span-1 row-span-1 h-48 bg-gray-800/50 rounded-lg"
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // If there's a search query, show search results
    if (query) {
        return <SearchResults query={query} onTrackClick={handlePlayTrack} />;
    }

    // Otherwise show the Bento grid home page
    return <BentoGrid tracks={allTracks} onTrackClick={handlePlayTrack} />;
}
