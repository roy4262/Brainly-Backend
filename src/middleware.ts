import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key";

interface JwtPayload {
  id: string;
}

export const userMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ msg: "Authorization header missing" });
  }

  try {
    const decoded = jwt.verify(authHeader, JWT_SECRET) as JwtPayload;

    // Attach userId to request
    // @ts-ignore
    req.userId = decoded.id;

    next();
  } catch (err) {
    console.error("JWT verification failed:", err);
    return res.status(403).json({ msg: "Invalid or expired token" });
  }
};
