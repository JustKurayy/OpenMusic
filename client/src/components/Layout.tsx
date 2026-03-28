import { useState } from "react";
import { motion } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import MusicPlayer from "@/components/MusicPlayer";
import QueueDrawer from "@/components/QueueDrawer";
import Lyrics from "@/components/Lyrics";
import { usePlayer } from "@/contexts/PlayerContext";

export default function Layout({ children }: { children: React.ReactNode }) {
    const [queueOpen, setQueueOpen] = useState(false);
    const { showLyrics } = usePlayer();

    return (
        <div className="spotify-shell flex h-screen flex-col overflow-hidden p-2">
            <TopBar />
            <div className="flex min-h-0 flex-1 gap-2">
                <Sidebar />
                <motion.main
                    className="spotify-panel spotify-main-gradient min-h-0 flex-1 overflow-y-auto"
                    initial={false}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {showLyrics ? <Lyrics /> : children}
                </motion.main>
                <QueueDrawer
                    isOpen={queueOpen}
                    onClose={() => setQueueOpen(false)}
                />
            </div>
            <MusicPlayer onToggleQueue={() => setQueueOpen((open) => !open)} />
        </div>
    );
}
