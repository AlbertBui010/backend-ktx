import express from "express";
import { body } from "express-validator";
import { authController } from "../controllers/auth.controller.js";
import { authenticateToken, requireAdmin, requireStaff, verifyRefreshToken } from "../middleware/auth.middleware.js";
import { validationMiddleware } from "../middleware/validation.middleware.js";

const router = express.Router();

// Validation rules
const loginStaffValidation = [
  body("ma_nv")
    .notEmpty()
    .withMessage("Employee ID is required")
    .isLength({ min: 3, max: 20 })
    .withMessage("Employee ID must be between 3 and 20 characters"),
  body("mat_khau").notEmpty().withMessage("Password is required"),
];

const loginStudentValidation = [
  body("mssv")
    .notEmpty()
    .withMessage("Student ID is required")
    .isLength({ min: 8, max: 20 })
    .withMessage("Student ID must be between 8 and 20 characters"),
  body("mat_khau").notEmpty().withMessage("Password is required"),
];

const registerStaffValidation = [
  body("ma_nv")
    .notEmpty()
    .withMessage("Employee ID is required")
    .isLength({ min: 3, max: 20 })
    .withMessage("Employee ID must be between 3 and 20 characters"),
  body("ten")
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("mat_khau")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
  body("role").optional().isIn(["admin", "staff"]).withMessage("Role must be either admin or staff"),
  body("email").optional().isEmail().withMessage("Invalid email format"),
  body("sdt")
    .optional()
    .matches(/^[0-9+\-\s()]*$/)
    .withMessage("Invalid phone number format"),
];

const registerStudentValidation = [
  body("mssv")
    .notEmpty()
    .withMessage("Student ID is required")
    .isLength({ min: 8, max: 20 })
    .withMessage("Student ID must be between 8 and 20 characters"),
  body("ten")
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("email").optional().isEmail().withMessage("Invalid email format"),
  body("sdt")
    .optional()
    .matches(/^[0-9+\-\s()]*$/)
    .withMessage("Invalid phone number format"),
  body("phai").optional().isIn(["Nam", "Nữ", "Khác"]).withMessage("Gender must be Nam, Nữ, or Khác"),
];

const refreshTokenValidation = [body("refreshToken").notEmpty().withMessage("Refresh token is required")];

const changePasswordValidation = [
  body("current_password").notEmpty().withMessage("Current password is required"),
  body("new_password")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters long"),
];

// Public routes
router.post("/login/staff", loginStaffValidation, validationMiddleware, authController.loginStaff);
router.post("/login/student", loginStudentValidation, validationMiddleware, authController.loginStudent);
router.post("/refresh", refreshTokenValidation, verifyRefreshToken, authController.refreshToken);

// Protected routes
router.post(
  "/register/staff",
  authenticateToken,
  requireAdmin,
  registerStaffValidation,
  validationMiddleware,
  authController.registerStaff,
);
router.post(
  "/register/student",
  authenticateToken,
  requireStaff,
  registerStudentValidation,
  validationMiddleware,
  authController.registerStudent,
);
router.post("/logout", authenticateToken, authController.logout);
router.get("/profile", authenticateToken, authController.getProfile);
router.post(
  "/change-password",
  authenticateToken,
  changePasswordValidation,
  validationMiddleware,
  authController.changePassword,
);

export default router;
