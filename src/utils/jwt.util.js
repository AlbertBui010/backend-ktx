import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

export const jwtUtils = {
  // Generate access token
  generateAccessToken: (payload) => {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_ACCESS_EXPIRES_IN,
    });
  },

  // Generate refresh token
  generateRefreshToken: (payload) => {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    });
  },

  // Verify token
  verifyToken: (token) => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error("Invalid or expired token");
    }
  },

  // Extract token from authorization header
  extractTokenFromHeader: (authHeader) => {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    return authHeader.substring(7); // Remove "Bearer " prefix
  },

  // Get token expiration time in seconds
  getTokenExpirationTime: (tokenType = "refresh") => {
    const expiresIn = tokenType === "access" ? JWT_ACCESS_EXPIRES_IN : JWT_REFRESH_EXPIRES_IN;

    // Convert time string to seconds
    const timeValue = parseInt(expiresIn);
    const timeUnit = expiresIn.slice(-1);

    switch (timeUnit) {
      case "s":
        return timeValue;
      case "m":
        return timeValue * 60;
      case "h":
        return timeValue * 3600;
      case "d":
        return timeValue * 86400;
      default:
        return 604800; // Default 7 days
    }
  },
};

export default jwtUtils;
