import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import MusicPlayer from "@/components/MusicPlayer";
import QueueDrawer from "@/components/QueueDrawer";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-spotify-black text-spotify-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* TopBar is absolutely positioned and overlays main content */}
        <TopBar />
        <main className="flex-1 overflow-y-auto pt-28 px-10 pb-32 max-w-full w-full mx-auto">
          {children}
        </main>
        <MusicPlayer />
      </div>
      <QueueDrawer />
    </div>
  );
}
