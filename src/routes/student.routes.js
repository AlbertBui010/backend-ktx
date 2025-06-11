import express from "express";
import { body, param } from "express-validator";
import { studentController } from "../controllers/student.controller.js";
import { authenticateToken, requireStaff } from "../middleware/auth.middleware.js";
import { validationMiddleware } from "../middleware/validation.middleware.js";

const router = express.Router();

// Validation rules
const updateStudentValidation = [
  body("ten").optional().isLength({ min: 2, max: 100 }).withMessage("Name must be between 2 and 100 characters"),
  body("email").optional().isEmail().withMessage("Invalid email format"),
  body("sdt")
    .optional()
    .matches(/^[0-9+\-\s()]*$/)
    .withMessage("Invalid phone number format"),
  body("phai").optional().isIn(["Nam", "Nữ", "Khác"]).withMessage("Gender must be Nam, Nữ, or Khác"),
];

const addParentValidation = [
  body("ten")
    .notEmpty()
    .withMessage("Parent name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Parent name must be between 2 and 100 characters"),
  body("quan_he")
    .notEmpty()
    .withMessage("Relationship is required")
    .isIn(["Cha", "Mẹ", "Anh", "Chị", "Em", "Ông", "Bà", "Khác"])
    .withMessage("Invalid relationship"),
  body("sdt")
    .optional()
    .matches(/^[0-9+\-\s()]*$/)
    .withMessage("Invalid phone number format"),
  body("email").optional().isEmail().withMessage("Invalid email format"),
];

const updateParentValidation = [
  body("ten").optional().isLength({ min: 2, max: 100 }).withMessage("Parent name must be between 2 and 100 characters"),
  body("quan_he")
    .optional()
    .isIn(["Cha", "Mẹ", "Anh", "Chị", "Em", "Ông", "Bà", "Khác"])
    .withMessage("Invalid relationship"),
  body("sdt")
    .optional()
    .matches(/^[0-9+\-\s()]*$/)
    .withMessage("Invalid phone number format"),
  body("email").optional().isEmail().withMessage("Invalid email format"),
];

const setupPasswordValidation = [
  body("token").notEmpty().withMessage("Token is required"),
  body("new_password")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
];

const idValidation = [param("id").isInt({ min: 1 }).withMessage("Valid student ID is required")];

const parentIdValidation = [param("parentId").isInt({ min: 1 }).withMessage("Valid parent ID is required")];

// Student routes (Staff+ access)
router.get("/", authenticateToken, requireStaff, studentController.getStudents);
router.get(
  "/without-accommodation",
  authenticateToken,
  requireStaff,
  studentController.getStudentsWithoutAccommodation,
);
router.get(
  "/:id",
  authenticateToken,
  requireStaff,
  idValidation,
  validationMiddleware,
  studentController.getStudentById,
);
router.put(
  "/:id",
  authenticateToken,
  requireStaff,
  idValidation,
  updateStudentValidation,
  validationMiddleware,
  studentController.updateStudent,
);

// Parent routes (Staff+ access)
router.post(
  "/:id/parents",
  authenticateToken,
  requireStaff,
  idValidation,
  addParentValidation,
  validationMiddleware,
  studentController.addParent,
);
router.put(
  "/parents/:parentId",
  authenticateToken,
  requireStaff,
  parentIdValidation,
  updateParentValidation,
  validationMiddleware,
  studentController.updateParent,
);
router.delete(
  "/parents/:parentId",
  authenticateToken,
  requireStaff,
  parentIdValidation,
  validationMiddleware,
  studentController.deleteParent,
);

// Password setup (Public route)
router.post("/setup-password", setupPasswordValidation, validationMiddleware, studentController.setupPassword);

export default router;
