import { useState } from "react";
import { ChevronLeft, ChevronRight, Search, User } from "lucide-react";
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

    return (
        <header className="mb-2 flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
            </div>

            <div className="relative mx-4 w-full max-w-md">
                <Search className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
                    className="w-full rounded-full border-transparent bg-[#242424] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-400 focus:border-transparent focus:bg-[#2a2a2a]"
                />
                {showDropdown && query && <SearchDropdown query={query} />}
            </div>

            <div className="relative">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 rounded-full p-0"
                    onClick={() => setShowMenu((v) => !v)}
                >
                    {user?.avatar ? (
                        <img
                            src={user.avatar}
                            alt={user.name}
                            className="h-8 w-8 rounded-full object-cover"
                        />
                    ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#333]">
                            {user?.name ? (
                                <span className="text-sm font-medium text-white">
                                    {user.name.charAt(0).toUpperCase()}
                                </span>
                            ) : (
                                <User className="h-4 w-4 text-white" />
                            )}
                        </div>
                    )}
                </Button>
                {showMenu && (
                    <div className="spotify-panel absolute right-0 z-50 mt-2 w-44 py-1">
                        <button className="w-full px-3 py-2 text-left text-sm hover:bg-white/10">
                            Profile
                        </button>
                        <button className="w-full px-3 py-2 text-left text-sm hover:bg-white/10">
                            Settings
                        </button>
                        <button
                            className="w-full px-3 py-2 text-left text-sm hover:bg-white/10"
                            onClick={() => {
                                setShowMenu(false);
                                logout();
                            }}
                        >
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
