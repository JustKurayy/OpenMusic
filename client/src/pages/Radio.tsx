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
            <h1 className="text-3xl font-bold text-white mb-6">
                Extensive Radio Search
            </h1>
            <form onSubmit={handleSearch} className="mb-6 flex gap-2">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for radio stations..."
                    className="px-4 py-2 rounded-lg bg-gray-900 text-white w-full"
                />
                <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-green-500 text-black font-bold"
                >
                    Search
                </button>
            </form>
            {loading && <div className="text-white">Loading...</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((radio) => (
                    <div
                        key={radio.stationuuid}
                        className="bg-[#232323] rounded-xl p-4 shadow-lg"
                    >
                        <h2 className="text-lg font-bold text-white mb-2">
                            {radio.name}
                        </h2>
                        <p className="text-gray-400 mb-2">
                            {radio.country} - {radio.language}
                        </p>
                        <audio
                            controls
                            src={radio.url_resolved}
                            className="w-full"
                        />
                        <a
                            href={radio.homepage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-400 underline mt-2 block"
                        >
                            Visit Station
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
}
