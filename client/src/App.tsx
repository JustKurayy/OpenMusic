import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { SearchProvider } from "@/contexts/SearchContext";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Library from "@/pages/Library";
import Upload from "@/pages/Upload";
import Playlist from "@/pages/Playlist";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";
import SearchPage from "@/pages/Search";
import CreatePlaylist from "@/pages/CreatePlaylist";
import Radio from "@/pages/Radio";
import { AnimatePresence, motion } from "framer-motion";

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
    const [location] = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-spotify-black flex items-center justify-center">
                <div className="text-spotify-white">Loading...</div>
            </div>
        );
    }

    if (!user) {
        // Render login overlaying the entire app
        return (
            <div className="fixed inset-0 w-screen z-50 bg-black bg-opacity-90">
                <Login />
            </div>
        );
    }

    return (
        <Layout>
            <div className="flex-1 flex flex-col overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={location}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="h-full"
                    >
                        <Switch>
                            <Route path="/" component={Home} />
                            <Route path="/library" component={Library} />
                            <Route path="/upload" component={Upload} />
                            <Route path="/radio" component={Radio} />
                            <Route path="/playlist/:id" component={Playlist} />
                            <Route path="/search" component={SearchPage} />
                            <Route
                                path="/create-playlist"
                                component={CreatePlaylist}
                            />
                            <Route component={NotFound} />
                        </Switch>
                    </motion.div>
                </AnimatePresence>
            </div>
        </Layout>
    );
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <TooltipProvider>
                <AuthProvider>
                    <PlayerProvider>
                        <SearchProvider>
                            <Toaster />
                            <AppContent />
                        </SearchProvider>
                    </PlayerProvider>
                </AuthProvider>
            </TooltipProvider>
        </QueryClientProvider>
    );
}

export default App;
