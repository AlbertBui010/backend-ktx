import express from "express";
import { body, param } from "express-validator";
import { registrationController } from "../controllers/registration.controller.js";
import { authenticateToken, requireStaff } from "../middleware/auth.middleware.js";
import { validationMiddleware } from "../middleware/validation.middleware.js";

const router = express.Router();

// Validation rules
const createRegistrationValidation = [
  body("id_sinh_vien").isInt({ min: 1 }).withMessage("Valid student ID is required"),
  body("ngay_bat_dau").isISO8601().withMessage("Valid start date is required"),
  body("ngay_ket_thuc").isISO8601().withMessage("Valid end date is required"),
  body("ly_do_dang_ky")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Registration reason must not exceed 500 characters"),
];

const approveRegistrationValidation = [
  body("id_giuong").isInt({ min: 1 }).withMessage("Valid bed ID is required"),
  body("ghi_chu").optional().isLength({ max: 500 }).withMessage("Note must not exceed 500 characters"),
];

const rejectRegistrationValidation = [
  body("ly_do_tu_choi")
    .notEmpty()
    .withMessage("Rejection reason is required")
    .isLength({ min: 10, max: 500 })
    .withMessage("Rejection reason must be between 10 and 500 characters"),
];

const idValidation = [param("id").isInt({ min: 1 }).withMessage("Valid registration ID is required")];

// Registration routes

// Public/Student routes (Students can create their own registrations)
router.post("/", createRegistrationValidation, validationMiddleware, registrationController.createRegistration);

// Student can view their own registrations
router.get("/my-registrations", authenticateToken, registrationController.getMyRegistrations);

// Staff+ routes
router.get("/", authenticateToken, requireStaff, registrationController.getRegistrations);
router.get(
  "/:id",
  authenticateToken,
  requireStaff,
  idValidation,
  validationMiddleware,
  registrationController.getRegistrationById,
);

// Admin/Staff approval actions
router.post(
  "/:id/approve",
  authenticateToken,
  requireStaff,
  idValidation,
  approveRegistrationValidation,
  validationMiddleware,
  registrationController.approveRegistration,
);
router.post(
  "/:id/reject",
  authenticateToken,
  requireStaff,
  idValidation,
  rejectRegistrationValidation,
  validationMiddleware,
  registrationController.rejectRegistration,
);

// Cancel registration (Students can cancel their own, Staff can cancel any)
router.post(
  "/:id/cancel",
  authenticateToken,
  idValidation,
  validationMiddleware,
  registrationController.cancelRegistration,
);

export default router;
