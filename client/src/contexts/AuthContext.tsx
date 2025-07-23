import { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi, type ApiUser } from "@/lib/api";

interface AuthContextType {
  user: ApiUser | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: !!token,
    retry: false,
    staleTime: 0, // Always refetch when invalidated
  });

  const login = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    
    // Force a refetch after token is set
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });
    }, 100);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      setToken(null);
      queryClient.clear();
      window.location.href = "/login";
    }
  };

  // Check for token in URL (from OAuth callback)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("token");
    
    if (urlToken) {
      login(urlToken);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Use the user data from the backend or null
  let currentUser = user || null;

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        token,
        login,
        logout,
        isLoading: isLoading && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
