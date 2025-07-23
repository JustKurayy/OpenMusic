import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Home, Search, Library, Upload, Plus, Music } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { playlistsApi, type ApiPlaylist } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const { data: playlists = [] } = useQuery<ApiPlaylist[]>({
    queryKey: ["/api/playlists"],
    enabled: !!user,
  });

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/search", label: "Search", icon: Search },
    { href: "/library", label: "Your Library", icon: Library },
    { href: "/upload", label: "Upload Music", icon: Upload },
  ];

  return (
    <aside className="w-60 bg-spotify-black border-r border-spotify-light-gray flex flex-col">
      {/* Brand */}
      <div className="p-6 border-b border-spotify-light-gray">
        <div className="flex items-center space-x-3">
          <Music className="text-spotify-green text-2xl" />
          <span className="text-xl font-bold text-spotify-white">MusicStream</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6">
        <ul className="space-y-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <li key={item.href}>
                <Link href={item.href}>
                  <a className={cn(
                    "flex items-center space-x-3 py-2 transition-colors duration-200",
                    isActive 
                      ? "text-spotify-white spotify-green" 
                      : "text-spotify-text hover:text-spotify-white"
                  )}>
                    <Icon className="text-lg w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Playlists Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-spotify-text text-sm font-semibold uppercase tracking-wider">
              Playlists
            </h3>
            <Link href="/playlist/new">
              <button className="text-spotify-text hover:text-spotify-white transition-colors duration-200">
                <Plus className="w-4 h-4" />
              </button>
            </Link>
          </div>
          <ul className="space-y-2">
            {playlists.map((playlist) => (
              <li key={playlist.id}>
                <Link href={`/playlist/${playlist.id}`}>
                  <a className="block text-spotify-text hover:text-spotify-white transition-colors duration-200 py-1 truncate">
                    {playlist.name}
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* User Profile */}
      {user && (
        <div className="p-6 border-t border-spotify-light-gray">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-spotify-green to-green-600 rounded-full flex items-center justify-center">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
              ) : (
                <span className="text-white text-sm font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-spotify-white">{user.name}</p>
              <p className="text-xs text-spotify-text truncate">{user.email}</p>
            </div>
            <button 
              onClick={logout}
              className="text-spotify-text hover:text-spotify-white transition-colors duration-200"
              title="Logout"
            >
              <i className="fas fa-sign-out-alt" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
