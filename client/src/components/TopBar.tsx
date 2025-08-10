import { useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SearchDropdown from "@/components/SearchDropdown";
import { useAuth } from "@/contexts/AuthContext";

export default function TopBar() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="bg-gradient-to-b from-spotify-light-gray to-transparent p-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" className="w-8 h-8 bg-black bg-opacity-70 rounded-full text-spotify-text hover:bg-opacity-80">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" className="w-8 h-8 bg-black bg-opacity-70 rounded-full text-spotify-text hover:bg-opacity-80">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex-1 max-w-xl mx-8 relative">
        <Input
          type="text"
          placeholder="What do you want to play?"
          value={searchQuery}
          onChange={e => {
            setSearchQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          className="w-full bg-spotify-light-gray border-spotify-light-gray rounded-full py-2 pl-10 pr-4 text-sm text-spotify-white placeholder-spotify-text focus:border-spotify-green"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-spotify-text w-4 h-4" />
        {showDropdown && searchQuery && (
          <SearchDropdown query={searchQuery} />
        )}
      </div>
      <div className="flex items-center space-x-4">
        <div className="w-8 h-8 bg-gradient-to-br from-spotify-green to-green-600 rounded-full flex items-center justify-center">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
          ) : (
            <span className="text-white text-sm font-medium">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
