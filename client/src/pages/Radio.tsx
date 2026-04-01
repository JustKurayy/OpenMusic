import { useState } from "react";
import { getCountries, searchRadios } from "@/lib/radioApi";

export default function RadioSearchPage() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const radios = await searchRadios(query);
        setResults(radios);
        setLoading(false);
    };

    return (
        <div className="p-8 min-h-screen h-full popofffront">
            <h1 className="text-2xl font-bold text-white mb-8">
                Explore Radio Stations
            </h1>
            <form onSubmit={handleSearch} className="mb-8 flex gap-3">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search radio stations..."
                    className="px-4 py-2 rounded-md bg-gray-800 text-white w-full placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                    type="submit"
                    className="px-6 py-2 rounded-md bg-green-500 hover:bg-green-400 text-black font-semibold transition-colors"
                >
                    Search
                </button>
            </form>
            {loading && <div className="text-gray-400">Loading...</div>}
            {results.length === 0 && !loading && query && (
                <div className="text-center py-12">
                    <p className="text-gray-400">No stations found. Try another search.</p>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((radio) => (
                    <div
                        key={radio.stationuuid}
                        className="bg-gray-900 hover:bg-gray-800 rounded-md p-4 transition-colors"
                    >
                        <h2 className="text-base font-semibold text-white mb-1 truncate">
                            {radio.name}
                        </h2>
                        <p className="text-sm text-gray-500 mb-3 truncate">
                            {radio.country} {radio.language && `· ${radio.language}`}
                        </p>
                        <audio
                            controls
                            src={radio.url_resolved}
                            className="w-full mb-3"
                        />
                        {radio.homepage && (
                            <a
                                href={radio.homepage}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-500 hover:text-green-400 text-sm transition-colors"
                            >
                                Visit Website →
                            </a>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
