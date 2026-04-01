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
            <div className="flex-1 overflow-y-auto"
                style={{
                    background: 'linear-gradient(180deg, hsl(0, 0%, 12%) 0%, hsl(0, 0%, 7%) 40%, hsl(0, 0%, 5%) 100%)',
                }}
            >
                <div className="p-6 md:p-8">
                    {/* Greeting skeleton */}
                    <div className="pt-4 mb-10">
                        <div className="h-10 w-64 bg-neutral-800/50 rounded-lg animate-pulse" />
                    </div>

                    {/* Section skeletons */}
                    {[...Array(4)].map((_, sectionIndex) => (
                        <div key={sectionIndex} className="mb-10">
                            <div className="h-7 w-48 bg-neutral-800/50 rounded-lg animate-pulse mb-6" />
                            <div className="flex gap-5">
                                {[...Array(6)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="flex-shrink-0 w-52"
                                    >
                                        <div className="w-full aspect-square bg-neutral-800/50 rounded-xl animate-pulse mb-4" />
                                        <div className="h-4 w-32 bg-neutral-800/50 rounded animate-pulse mb-2" />
                                        <div className="h-3 w-24 bg-neutral-800/30 rounded animate-pulse" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
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
