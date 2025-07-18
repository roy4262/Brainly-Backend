import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key";

interface JwtPayload {
  id: string;
}

// Use intersection type to add userId to Request
export type AuthenticatedRequest = Request & {
  userId?: string;
}

export const userMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ msg: "Authorization header missing" });
  }

  try {
    const decoded = jwt.verify(authHeader, JWT_SECRET) as JwtPayload;

    
    req.userId = decoded.id;

    next();
  } catch (err: any) {
    console.error("JWT verification failed:", err);
    return res.status(403).json({ msg: "Invalid or expired token" });
  }
};
