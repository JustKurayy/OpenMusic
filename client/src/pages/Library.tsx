import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { tracksApi, playlistsApi, type ApiTrack, type ApiPlaylist } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import TrackList from "@/components/TrackList";
import { Music, Plus, Search, Grid3X3, List, Clock, Play, MoreHorizontal } from "lucide-react";

type ViewMode = 'list' | 'grid';
type FilterType = 'all' | 'playlists' | 'tracks';

export default function Library() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: tracks = [], isLoading: tracksLoading } = useQuery<ApiTrack[]>({
    queryKey: ["/api/tracks"],
    enabled: !!user,
  });

  const { data: playlists = [], isLoading: playlistsLoading } = useQuery<ApiPlaylist[]>({
    queryKey: ["/api/playlists"],
    enabled: !!user,
  });

  const isLoading = tracksLoading || playlistsLoading;

  const filteredTracks = tracks.filter(track => 
    track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPlaylists = playlists.filter(playlist =>
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const shouldShowTracks = filter === 'all' || filter === 'tracks';
  const shouldShowPlaylists = filter === 'all' || filter === 'playlists';

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-spotify-dark-gray to-black">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-10 bg-spotify-light-gray/20 rounded w-48 mb-8"></div>
            <div className="flex gap-4 mb-6">
              <div className="h-8 bg-spotify-light-gray/20 rounded w-20"></div>
              <div className="h-8 bg-spotify-light-gray/20 rounded w-24"></div>
              <div className="h-8 bg-spotify-light-gray/20 rounded w-16"></div>
            </div>
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 bg-spotify-light-gray/20 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isEmpty = tracks.length === 0 && playlists.length === 0;

  return (
    <div className="flex-1 overflow-y-auto popofffront min-h-screen">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Your Library</h1>
          <a href="/upload">
            <button className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition-all duration-200">
              <Plus className="w-6 h-6" />
            </button>
          </a>
        </div>

        {isEmpty ? (
            <div className="text-center py-20">
              <div className="mb-8">
                <Music className="w-24 h-24 text-gray-400 mx-auto mb-6" />
                <h2 className="text-2xl font-bold mb-3 text-white">Start building your library</h2>
                <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
                  Upload your favorite tracks and create playlists to organize your music collection.
                </p>
              </div>
              <div className="flex gap-4 justify-center">
                <a 
                  href="/upload"
                  className="inline-flex items-center px-8 py-4 bg-green-500 text-black font-bold rounded-full hover:bg-green-400 hover:scale-105 transition-all duration-200"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Upload Music
                </a>
                <button className="inline-flex items-center px-8 py-4 border-2 border-gray-500 text-white font-bold rounded-full hover:bg-white hover:text-black transition-all duration-200">
                  Create Playlist
                </button>
              </div>
            </div>
        ) : (
          <>
            {/* Controls Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {/* Filter Pills */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 text-sm font-bold rounded-full transition-all duration-200 ${
                      filter === 'all' 
                        ? 'bg-white text-black hover:bg-gray-100' 
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('playlists')}
                    className={`px-4 py-2 text-sm font-bold rounded-full transition-all duration-200 ${
                      filter === 'playlists' 
                        ? 'bg-white text-black hover:bg-gray-100' 
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    Playlists
                  </button>
                  <button
                    onClick={() => setFilter('tracks')}
                    className={`px-4 py-2 text-sm font-bold rounded-full transition-all duration-200 ${
                      filter === 'tracks' 
                        ? 'bg-white text-black hover:bg-gray-100' 
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    Tracks
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search in Your Library"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-800 text-white placeholder-gray-400 rounded-md w-80 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-gray-700 transition-colors"
                  />
                </div>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-gray-800 rounded-md p-1">
                  <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-gray-700 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-gray-700 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-8">
              {/* Playlists Section */}
              {shouldShowPlaylists && filteredPlaylists.length > 0 && (
                <section>
                  {filter === 'all' && (
                    <h2 className="text-2xl font-bold text-white mb-4">Your Playlists</h2>
                  )}
                  
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                      {filteredPlaylists.map((playlist) => (
                        <div className="group cursor-pointer">
                          <div className="relative bg-gray-900 bg-opacity-40 hover:bg-opacity-60 rounded-lg p-4 transition-all duration-200 hover:scale-105">
                            <div className="relative mb-4">
                              <div className="w-full aspect-square bg-gradient-to-br from-gray-600 to-gray-500 rounded-lg flex items-center justify-center overflow-hidden shadow-lg">
                                {playlist.coverImage ? (
                                  <img 
                                    src={playlist.coverImage} 
                                    alt={playlist.name} 
                                    className="w-full h-full object-cover" 
                                  />
                                ) : (
                                  <Music className="w-12 h-12 text-gray-300" />
                                )}
                              </div>
                              <button className="absolute bottom-2 right-2 w-12 h-12 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200 hover:scale-110">
                                <Play className="w-5 h-5 text-black ml-0.5 fill-current" />
                              </button>
                            </div>
                            <h3 className="font-bold text-white text-base mb-2 truncate group-hover:text-green-400 transition-colors duration-200">{playlist.name}</h3>
                            <p className="text-gray-400 text-sm truncate">
                              By {playlist.user?.name || "Unknown"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredPlaylists.map((playlist) => (
                        <div key={playlist.id} className="flex items-center space-x-4 p-2 rounded-lg hover:bg-gray-800 hover:bg-opacity-60 group cursor-pointer transition-all duration-200">
                          <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-500 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                            {playlist.coverImage ? (
                              <img 
                                src={playlist.coverImage} 
                                alt={playlist.name} 
                                className="w-12 h-12 object-cover" 
                              />
                            ) : (
                              <Music className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white truncate group-hover:text-green-400 transition-colors duration-200">{playlist.name}</p>
                            <p className="text-sm text-gray-400 truncate">
                              Playlist • {playlist.user?.name || "Unknown"}
                            </p>
                          </div>
                          <button className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-white transition-all">
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Tracks Section */}
              {shouldShowTracks && filteredTracks.length > 0 && (
                <section>
                  {filter === 'all' && playlists.length > 0 && (
                    <h2 className="text-2xl font-bold text-white mb-4">Uploaded by you</h2>
                  )}
                  
                  {viewMode === 'list' ? (
                    <div className="space-y-2">
                      {/* Header for track list */}
                      <div className="grid grid-cols-[16px_1fr_1fr_minmax(120px,1fr)] gap-4 px-4 py-2 text-sm font-medium text-gray-400 border-b border-gray-700 mb-2">
                        <span>#</span>
                        <span>Title</span>
                        <span>Album</span>
                        <Clock className="w-4 h-4 justify-self-end" />
                      </div>
                      <TrackList tracks={filteredTracks} />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                      {filteredTracks.map((track, index) => (
                        <div key={track.id} className="group cursor-pointer">
                          <div className="relative bg-gray-900 bg-opacity-40 hover:bg-opacity-60 rounded-lg p-4 transition-all duration-200 hover:scale-105">
                            <div className="relative mb-4">
                              <div className="w-full aspect-square bg-gradient-to-br from-gray-600 to-gray-500 rounded-lg flex items-center justify-center overflow-hidden shadow-lg">
                                {/* {track.coverArt ? (
                                  <img 
                                    src={track.coverArt} 
                                    alt={track.title} 
                                    className="w-full h-full object-cover" 
                                  />
                                ) : ( */}
                                  <Music className="w-12 h-12 text-gray-300" />
                                {/* )} */}
                              </div>
                              <button className="absolute bottom-2 right-2 w-12 h-12 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200 hover:scale-110">
                                <Play className="w-5 h-5 text-black ml-0.5 fill-current" />
                              </button>
                            </div>
                            <h3 className="font-bold text-white text-base mb-1 truncate group-hover:text-green-400 transition-colors duration-200">{track.title}</h3>
                            <p className="text-gray-400 text-sm truncate">{track.artist}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Empty State for Filtered Results */}
              {((shouldShowTracks && filteredTracks.length === 0) && (shouldShowPlaylists && filteredPlaylists.length === 0)) && searchQuery && (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-white">No results found</h3>
                  <p className="text-gray-400">Try searching with different keywords</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}