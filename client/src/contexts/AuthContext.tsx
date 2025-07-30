import { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi, type ApiUser } from "@/lib/api";

interface AuthContextType {
  user: ApiUser | null;
  token: string | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const queryClient = useQueryClient();

  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: !!token,
    retry: false,
    staleTime: 0, // Always refetch when invalidated
    gcTime: 0, // Don't cache
  });

  const login = async (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    
    // Force immediate refetch with new token and wait for result
    try {
      const result = await refetch();
      if (!result.data) {
        throw new Error("Failed to fetch user data");
      }
    } catch (error) {
      console.error("Failed to fetch user data after login:", error);
      // Clear invalid token
      localStorage.removeItem("token");
      setToken(null);
      throw error;
    }
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

  // Check for token in URL (from OAuth callback) and clean up invalid tokens
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("token");
    
    if (urlToken) {
      login(urlToken);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Only clear token if we get a 401/403 error, not based on undefined user data
  // The query will handle invalid tokens through error states

  // Use the user data from the backend or null
  let currentUser: ApiUser | null = null;
  if (user && typeof user === 'object' && 'id' in user && 'email' in user && 'name' in user) {
    currentUser = user as ApiUser;
  }

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
