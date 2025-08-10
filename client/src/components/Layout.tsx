import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import MusicPlayer from "@/components/MusicPlayer";
import QueueDrawer from "@/components/QueueDrawer";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [queueOpen, setQueueOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-spotify-black text-spotify-white overflow-hidden">
      {/* TopBar spans the full width at the top */}
      <TopBar />
      <div className="flex flex-1 min-h-0 min-w-0 relative">
        {/* Sidebar on the left */}
        <Sidebar />
        {/* Main content in the center */}
        <main className="flex-1 overflow-y-auto max-w-full w-full mx-auto">
          {children}
        </main>
        {/* QueueDrawer on the right */}
        <QueueDrawer isOpen={queueOpen} onClose={() => setQueueOpen(false)} />
      </div>
      {/* MusicPlayer spans the full width at the bottom */}
      <MusicPlayer onToggleQueue={() => setQueueOpen((open) => !open)} />
    </div>
  );
}