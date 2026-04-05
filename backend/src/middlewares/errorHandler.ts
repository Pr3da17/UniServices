import { Request, Response, NextFunction } from "express";
import type { ErrorResponse } from "../types";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("❌ Global Error:", err);

  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({
    error: message,
    timestamp: Date.now(),
  } as ErrorResponse);
};
