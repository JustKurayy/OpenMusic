import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import type { User } from "@shared/schema";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "a8d73bb6186c3577042e243fbf923959cbc407dd88de99e580dae2a8fa00746e";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET || "";

// Check if Google OAuth is configured
export const isGoogleOAuthConfigured = GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET;

// Configure Google OAuth strategy only if credentials are available
if (isGoogleOAuthConfigured) {
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
            return done(new Error("No email found in Google profile"), null);
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
          return done(error, null);
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

// Authentication middleware
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }

  (req as any).user = decoded;
  next();
}

// Authentication middleware that allows guest users
export function authenticateTokenOrGuest(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  console.log("request:",req);
  console.log("Token:", token);

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }

  (req as any).user = decoded;
  
  next();
}

// Optional authentication middleware (doesn't fail if no token)
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      (req as any).user = decoded;
    }
  }

  next();
}

export { passport };
