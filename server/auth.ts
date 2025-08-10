import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import type { User } from "@shared/schema";
import type { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";

// const JWT_SECRET = process.env.JWT_SECRET || "a8d73bb6186c3577042e243fbf923959cbc407dd88de99e580dae2a8fa00746e";
const JWT_SECRET = "fallback_jwt_secret";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET || "";

// Check if Google OAuth is configured
export const isGoogleOAuthConfigured = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);

// Configure Google OAuth strategy only if credentials are available
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName;
          const avatar = profile.photos?.[0]?.value;

          if (!email) {
            return done(new Error("No email found in Google profile"));
          }

          // Check if user exists
          let user = await storage.getUserByGoogleId(googleId);
          
          if (!user) {
            // Check if user exists with this email
            user = await storage.getUserByEmail(email);
            
            if (user) {
              // Update existing user with Google ID
              // This would require an update method in storage, for now create new
              user = await storage.createUser({
                googleId,
                email,
                name,
                avatar,
              });
            } else {
              // Create new user
              user = await storage.createUser({
                googleId,
                email,
                name,
                avatar,
              });
            }
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
}

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user || false);
  } catch (error) {
    done(error, false);
  }
});

// Create guest user for demo purposes
export function createGuestUser(): any {
  return {
    id: 0,
    email: "guest@musicstream.app",
    name: "Guest User",
    avatar: null,
    isGuest: true,
  };
}

// JWT token functions
export function generateToken(user: User | any): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      name: user.name,
      isGuest: user.isGuest || false,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Combined authentication middleware: allows guest or authenticated users
export function authenticateUserOrGuest(req: Request, res: Response, next: NextFunction) {
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  if (!token) {
    // Not logged in, treat as guest
    req.user = undefined;
    return next();
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    // Invalid token, treat as guest
    req.user = undefined;
    return next();
  }
  (req as any).user = decoded;
  next();
}

export { passport };
