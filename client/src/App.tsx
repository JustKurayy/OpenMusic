import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { PlayerProvider } from "@/contexts/PlayerContext";
import Sidebar from "@/components/Sidebar";
import MusicPlayer from "@/components/MusicPlayer";
import AudioPlayer from "@/components/AudioPlayer";
import Home from "@/pages/Home";
import Library from "@/pages/Library";
import Upload from "@/pages/Upload";
import Playlist from "@/pages/Playlist";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

// Update queryClient to include auth header
queryClient.setDefaultOptions({
  queries: {
    ...queryClient.getDefaultOptions().queries,
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey.join("/") as string, {
        credentials: "include",
      });

      if (res.status === 401) {
        window.location.href = "/login";
        return null;
      }

      if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }
      
      return await res.json();
    },
  },
});

function AppContent() {
  const { user, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-spotify-black flex items-center justify-center">
        <div className="text-spotify-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-spotify-black text-spotify-white">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-gradient-to-b from-spotify-light-gray to-transparent p-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="w-8 h-8 bg-black bg-opacity-70 rounded-full text-spotify-text hover:bg-opacity-80">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="w-8 h-8 bg-black bg-opacity-70 rounded-full text-spotify-text hover:bg-opacity-80">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search for songs, artists, or playlists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-spotify-light-gray border-spotify-light-gray rounded-full py-2 pl-10 pr-4 text-sm text-spotify-white placeholder-spotify-text focus:border-spotify-green"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-spotify-text w-4 h-4" />
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-to-br from-spotify-green to-green-600 rounded-full flex items-center justify-center">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
              ) : (
                <span className="text-white text-sm font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/library" component={Library} />
          <Route path="/upload" component={Upload} />
          <Route path="/playlist/:id" component={Playlist} />
          <Route component={NotFound} />
        </Switch>
      </main>
      
      <MusicPlayer />
      <AudioPlayer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <PlayerProvider>
            <Toaster />
            <AppContent />
          </PlayerProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
