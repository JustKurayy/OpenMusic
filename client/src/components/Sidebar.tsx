import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Home, Search, Library, Upload, Plus, Music, Users, ExternalLink, List, ArrowRight, Pin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { playlistsApi, type ApiPlaylist } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isLibraryExpanded, setIsLibraryExpanded] = useState(false);
  
  const isGuest = user && (user as any).isGuest;

  const { data: playlists = [] } = useQuery<ApiPlaylist[]>({
    queryKey: ["/api/playlists"],
    enabled: !!user,
  });

  const mainNavItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/search", label: "Search", icon: Search }
  ];

  return (
    <div className="flex">
      {/* Main Navigation */}
      <aside className="w-16 lg:w-80 bg-black flex flex-col">
        {/* Top Section - Brand */}
        <div className="p-4 lg:p-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center">
              <Music className="text-black w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-white hidden lg:block">MusicStream</span>
          </div>
        </div>

        {/* Main Navigation Items */}
        <nav className="px-3 lg:px-6">
          <ul className="space-y-2">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <li key={item.href}>
                  <Link href={item.href}>
                    <a className={cn(
                      "flex items-center space-x-4 py-3 px-3 rounded-lg transition-all duration-200 group",
                      isActive 
                        ? "bg-gray-800 text-white" 
                        : "text-gray-300 hover:text-white hover:bg-gray-900"
                    )}>
                      <Icon className="w-6 h-6 flex-shrink-0" />
                      <span className="font-semibold hidden lg:block">{item.label}</span>
                    </a>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Your Library Section */}
        <div className="mt-8 flex-1 flex flex-col">
          <div className="px-3 lg:px-6">
            <button
              onClick={() => setIsLibraryExpanded(!isLibraryExpanded)}
              className="flex items-center justify-between w-full py-3 px-3 rounded-lg text-gray-300 hover:text-white hover:bg-gray-900 transition-all duration-200 group"
            >
              <div className="flex items-center space-x-4">
                <Library className="w-6 h-6 flex-shrink-0" />
                <span className="font-semibold hidden lg:block">Your Library</span>
              </div>
              <div className="hidden lg:flex items-center space-x-2">
                <button className="p-2 rounded-full hover:bg-gray-800 transition-colors duration-200" title="Create playlist or folder">
                  <Plus className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-full hover:bg-gray-800 transition-colors duration-200" title="Show more">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </button>
          </div>

          {/* Library Content */}
          <div className="flex-1 px-3 lg:px-6 mt-4 min-h-0">

            {/* Search and Sort - Hidden on mobile */}
            <div className="hidden lg:flex items-center justify-between mb-4">
              <button className="p-2 text-gray-400 hover:text-white transition-colors duration-200" title="Search in Your Library">
                <Search className="w-4 h-4" />
              </button>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">Recents</span>
                <button className="p-1 text-gray-400 hover:text-white transition-colors duration-200" title="List view">
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Playlists List */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {user && (
                <ul className="space-y-1">
                  {/* Liked Songs */}
                  <li>
                    <Link href="/liked">
                      <a className="flex items-center space-x-3 py-2 px-3 rounded-lg text-gray-300 hover:text-white hover:bg-gray-900 transition-all duration-200 group">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-400 rounded flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-lg">♥</span>
                        </div>
                        <div className="hidden lg:block min-w-0 flex-1">
                          <p className="font-semibold text-white truncate">Liked Songs</p>
                          <p className="text-sm text-gray-400 truncate">
                            {playlists.length} liked songs
                          </p>
                        </div>
                        <Pin className="w-4 h-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden lg:block" />
                      </a>
                    </Link>
                  </li>

                  {/* Upload Music */}
                  <li>
                    <Link href="/upload">
                      <a className="flex items-center space-x-3 py-2 px-3 rounded-lg text-gray-300 hover:text-white hover:bg-gray-900 transition-all duration-200 group">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-400 rounded flex items-center justify-center flex-shrink-0">
                          <Upload className="w-6 h-6 text-white" />
                        </div>
                        <div className="hidden lg:block min-w-0 flex-1">
                          <p className="font-semibold text-white truncate">Upload Music</p>
                          <p className="text-sm text-gray-400 truncate">Add your tracks</p>
                        </div>
                      </a>
                    </Link>
                  </li>

                  {/* User Playlists */}
                  {playlists.map((playlist) => (
                    <li key={playlist.id}>
                      <Link href={`/playlist/${playlist.id}`}>
                        <a className="flex items-center space-x-3 py-2 px-3 rounded-lg text-gray-300 hover:text-white hover:bg-gray-900 transition-all duration-200 group">
                          <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-500 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                            {playlist.coverImage ? (
                              <img 
                                src={playlist.coverImage} 
                                alt={playlist.name} 
                                className="w-12 h-12 object-cover rounded" 
                              />
                            ) : (
                              <Music className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <div className="hidden lg:block min-w-0 flex-1">
                            <p className="font-semibold truncate">{playlist.name}</p>
                            <p className="text-sm text-gray-400 truncate flex items-center">
                              <span>Playlist</span>
                              <span className="mx-1">•</span>
                              <span>{playlist.user?.name || "Unknown"}</span>
                            </p>
                          </div>
                        </a>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              {/* Empty State */}
              {user && playlists.length === 0 && (
                <div className="hidden lg:block text-center py-8">
                  <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-white font-semibold mb-2">Create your first playlist</h3>
                  <p className="text-gray-400 text-sm mb-4">It's easy, we'll help you</p>
                  <Link href="/create-playlist">
                    <button className="bg-white text-black px-8 py-3 rounded-full font-semibold hover:scale-105 transition-transform duration-200">
                      Create playlist
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Profile - Hidden on mobile, shown in compact form on tablet */}
        {user && (
          <div className="p-4 lg:p-6 hidden md:block">
            <div className="flex items-center space-x-3">
              <div className="hidden lg:block flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {isGuest && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-500 text-black font-medium">
                      <Users className="w-3 h-3 mr-1" />
                      Guest
                    </span>
                  )}
                </div>
              </div>
              <div className="hidden lg:block">
                {isGuest && (
                  <button 
                    onClick={() => window.location.href = "/api/auth/google"}
                    className="p-2 text-green-500 hover:text-green-400 transition-colors duration-200 rounded-full hover:bg-gray-900"
                    title="Sign in with Google"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}