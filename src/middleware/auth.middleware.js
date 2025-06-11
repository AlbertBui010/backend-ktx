import { jwtUtils } from "../utils/jwt.util.js";
import { errorResponse } from "../utils/response.util.js";
import { redisUtils } from "../config/redis.config.js";
import { NhanVien, SinhVien } from "../models/index.js";
import { ENUM_NHAN_VIEN_TRANG_THAI, ENUM_SINH_VIEN_TRANG_THAI } from "../constants/database.constants.js";

// Middleware to verify JWT access token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = jwtUtils.extractTokenFromHeader(authHeader);

    if (!token) {
      return errorResponse(res, 401, "Access token required");
    }

    // Verify token
    const decoded = jwtUtils.verifyToken(token);

    // Check if user still exists and is active
    let user;
    if (decoded.userType === "nhan_vien") {
      user = await NhanVien.findByPk(decoded.userId);
      if (!user || user.trang_thai !== ENUM_NHAN_VIEN_TRANG_THAI.ACTIVE) {
        return errorResponse(res, 401, "User account is inactive or not found");
      }
    } else if (decoded.userType === "sinh_vien") {
      user = await SinhVien.findByPk(decoded.userId);
      if (
        !user ||
        ![ENUM_SINH_VIEN_TRANG_THAI.ACTIVE_RESIDENT, ENUM_SINH_VIEN_TRANG_THAI.APPLICANT].includes(user.trang_thai)
      ) {
        return errorResponse(res, 401, "Student account is inactive or not found");
      }
    } else {
      return errorResponse(res, 401, "Invalid user type");
    }

    // Attach user info to request
    req.user = {
      id: decoded.userId,
      type: decoded.userType,
      role: decoded.role,
      user: user,
    };

    next();
  } catch (error) {
    if (error.message === "Invalid or expired token") {
      return errorResponse(res, 401, "Invalid or expired access token");
    }
    return errorResponse(res, 500, "Authentication error", error.message);
  }
};

// Middleware to check if user is admin
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 401, "Authentication required");
  }

  if (req.user.type !== "nhan_vien" || req.user.role !== "admin") {
    return errorResponse(res, 403, "Admin access required");
  }

  next();
};

// Middleware to check if user is staff or admin
export const requireStaff = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 401, "Authentication required");
  }

  if (req.user.type !== "nhan_vien" || !["admin", "staff"].includes(req.user.role)) {
    return errorResponse(res, 403, "Staff access required");
  }

  next();
};

// Middleware to verify refresh token
export const verifyRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return errorResponse(res, 401, "Refresh token required");
    }

    // Verify token
    const decoded = jwtUtils.verifyToken(refreshToken);

    // Check if refresh token exists in Redis
    const storedToken = await redisUtils.getRefreshToken(decoded.userId);
    if (!storedToken || storedToken !== refreshToken) {
      return errorResponse(res, 401, "Invalid or expired refresh token");
    }

    // Check if user still exists and is active
    let user;
    if (decoded.userType === "nhan_vien") {
      user = await NhanVien.findByPk(decoded.userId);
      if (!user || user.trang_thai !== ENUM_NHAN_VIEN_TRANG_THAI.ACTIVE) {
        return errorResponse(res, 401, "User account is inactive or not found");
      }
    } else if (decoded.userType === "sinh_vien") {
      user = await SinhVien.findByPk(decoded.userId);
      if (
        !user ||
        ![ENUM_SINH_VIEN_TRANG_THAI.ACTIVE_RESIDENT, ENUM_SINH_VIEN_TRANG_THAI.APPLICANT].includes(user.trang_thai)
      ) {
        return errorResponse(res, 401, "Student account is inactive or not found");
      }
    } else {
      return errorResponse(res, 401, "Invalid user type");
    }

    // Attach user info to request
    req.user = {
      id: decoded.userId,
      type: decoded.userType,
      role: decoded.role,
      user: user,
    };

    next();
  } catch (error) {
    if (error.message === "Invalid or expired token") {
      return errorResponse(res, 401, "Invalid or expired refresh token");
    }
    return errorResponse(res, 500, "Refresh token verification error", error.message);
  }
};
