import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Music, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/api";

export default function Login() {
  const { user, login } = useAuth();
  const [, setLocation] = useLocation();

  const { data: authStatus } = useQuery({
    queryKey: ["/api/auth/status"],
  });

  const guestLoginMutation = useMutation({
    mutationFn: authApi.guestLogin,
    onSuccess: async () => {
      await login();
    },
  });

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  const handleGuestLogin = () => {
    guestLoginMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-spotify-black flex items-center justify-center">
      <Card className="w-full max-w-md mx-4 bg-spotify-gray border-spotify-light-gray">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <Music className="text-spotify-green text-4xl mb-4 mx-auto" />
            <h2 className="text-2xl font-bold mb-2 text-spotify-white">Welcome to MusicStream</h2>
            <p className="text-spotify-text">Sign in to access your music library</p>
          </div>
          
          {(authStatus as any)?.googleOAuthConfigured && (
            <Button
              onClick={handleGoogleLogin}
              className="w-full bg-white text-black font-semibold py-3 px-6 rounded-full hover:bg-gray-200 transition-colors duration-200 mb-4 flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
          )}

          {(authStatus as any)?.guestModeAvailable && (
            <>
              {(authStatus as any)?.googleOAuthConfigured && (
                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-spotify-light-gray"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-spotify-gray text-spotify-text">or</span>
                  </div>
                </div>
              )}
              
              <Button
                onClick={handleGuestLogin}
                disabled={guestLoginMutation.isPending}
                className="w-full bg-spotify-light-gray text-spotify-white font-semibold py-3 px-6 rounded-full hover:bg-opacity-80 transition-colors duration-200 mb-4 flex items-center justify-center"
              >
                <Users className="w-5 h-5 mr-3" />
                {guestLoginMutation.isPending ? "Entering..." : "Continue as Guest"}
              </Button>
              
              <p className="text-xs text-spotify-text text-center">
                Guest mode lets you explore the app with limited features
              </p>
            </>
          )}
          
          {!(authStatus as any)?.guestModeAvailable && (authStatus as any)?.googleOAuthConfigured && (
            <p className="text-xs text-spotify-text text-center">
              By continuing, you agree to our Terms of Service
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
