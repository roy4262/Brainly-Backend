// src/types/express.d.ts
// This file extends the Express Request interface globally
// Note: We're also using AuthenticatedRequest interface in middleware.ts for better type safety

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
