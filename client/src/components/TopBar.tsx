import { useState } from "react";
import { ChevronLeft, ChevronRight, Search, Bell, Download, User, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SearchDropdown from "@/components/SearchDropdown";
import { useAuth } from "@/contexts/AuthContext";
import { useSearch } from "@/contexts/SearchContext";

export default function TopBar() {
  const { user, logout } = useAuth();
  const { query, setQuery } = useSearch();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const accountMenuItems = [
    { label: 'Profile', action: () => {} },
    { label: 'Settings', action: () => {} },
    { label: 'Logout', action: () => { setShowMenu(false); logout(); } },
  ];

  return (
    <header className="bg-black p-4 flex items-center justify-between sticky top-0 z-50 border-opacity-50">
      {/* extra */}
      <div className="flex items-center space-x-2">
        {/* add here */}
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-sm mx-8 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
          <Input
            type="text"
            placeholder="What do you want to play?"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            className="w-full bg-gray-800 bg-opacity-80 hover:bg-opacity-100 focus:bg-white focus:text-black border-0 rounded-full py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-400 focus:placeholder-gray-500 transition-all duration-200 focus:ring-0 focus:outline-none"
          />
        </div>
        {showDropdown && query && (
          <SearchDropdown query={query} />
        )}
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative group">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-8 h-8 p-0 rounded-full border-0 hover:ring-2 hover:ring-gray-500 transition-all duration-200"
            onClick={() => setShowMenu((v) => !v)}
          >
            {user?.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-600 hover:bg-gray-500 rounded-full flex items-center justify-center transition-colors duration-200">
                {user?.name ? (
                  <span className="text-white text-sm font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </div>
            )}
          </Button>
          {/* Burger menu dropdown */}
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-black border border-gray-800 rounded-lg shadow-lg z-50 py-2">
              {accountMenuItems.map((item, index) => (
                <button
                  key={index}
                  className="w-full text-left px-4 py-2 text-white hover:bg-gray-800 transition-colors duration-200"
                  onClick={() => { item.action(); setShowMenu(false); }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}