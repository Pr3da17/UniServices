import rateLimit from "express-rate-limit";

// Limit general API requests
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Limit increased to avoid blocks during dashboard usage
  message: {
    error: "Too many requests from this IP, please try again after 15 minutes",
    timestamp: Date.now(),
  },
});

// Stricter limit for login attempts
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit dramatically increased for testing
  message: {
    error: "Too many login attempts. Please try again later.",
    timestamp: Date.now(),
  },
});
