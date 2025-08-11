import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search as SearchIcon } from "lucide-react";
import TrackList from "@/components/TrackList";

export default function Search() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { data: tracks, isLoading } = useQuery({
    queryKey: ["/api/tracks", { search: query }],
    queryFn: async () => {
      if (!query) return [];
      const res = await fetch(`/api/tracks?search=${encodeURIComponent(query)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tracks");
      return res.json();
    },
    enabled: submitted && !!query,
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-gray-900 to-black text-spotify-white pt-12">
      <Card className="w-full max-w-2xl p-8 bg-spotify-gray border-spotify-light-gray">
        <h1 className="text-2xl font-bold mb-6 text-spotify-white">Search Music</h1>
        <form onSubmit={handleSearch} className="flex items-center gap-2 mb-6">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Search for songs, artists, or albums..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-spotify-light-gray border-spotify-light-gray rounded-full py-2 pl-10 pr-4 text-sm text-spotify-white placeholder-spotify-text focus:border-spotify-green"
            />
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-spotify-text w-4 h-4" />
          </div>
          <Button type="submit" className="bg-spotify-green text-white rounded-full px-6 py-2 font-semibold hover:bg-green-600">
            Search
          </Button>
        </form>
        {isLoading && <div className="text-spotify-text">Loading...</div>}
        {tracks && tracks.length === 0 && submitted && query && <div className="text-spotify-text">No results found.</div>}
        {tracks && tracks.length > 0 && (
          <TrackList tracks={tracks} showHeader={false} showAlbum={true} showDateAdded={false} />
        )}
      </Card>
    </div>
  );
}
