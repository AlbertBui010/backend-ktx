import express from "express";
import { body } from "express-validator";
import { roomController } from "../controllers/room.controller.js";
import { authenticateToken, requireStaff } from "../middleware/auth.middleware.js";
import { validationMiddleware } from "../middleware/validation.middleware.js";

const router = express.Router();

// Validation rules
const createRoomTypeValidation = [
  body("ten_loai")
    .notEmpty()
    .withMessage("Room type name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Room type name must be between 2 and 50 characters"),
  body("so_giuong").isInt({ min: 1, max: 10 }).withMessage("Number of beds must be between 1 and 10"),
  body("gia_thue").isFloat({ min: 0 }).withMessage("Price must be a positive number"),
  body("dien_tich").optional().isFloat({ min: 0 }).withMessage("Area must be a positive number"),
];

const createRoomValidation = [
  body("ten_phong")
    .notEmpty()
    .withMessage("Room name is required")
    .isLength({ min: 1, max: 20 })
    .withMessage("Room name must be between 1 and 20 characters"),
  body("id_loai_phong").isInt({ min: 1 }).withMessage("Valid room type ID is required"),
  body("so_tang").isInt({ min: 1, max: 20 }).withMessage("Floor must be between 1 and 20"),
  body("gioi_tinh").optional().isIn(["Nam", "Nữ", "Hỗn hợp"]).withMessage("Gender must be Nam, Nữ, or Hỗn hợp"),
];

const createBedValidation = [
  body("ten_giuong")
    .notEmpty()
    .withMessage("Bed name is required")
    .isLength({ min: 1, max: 20 })
    .withMessage("Bed name must be between 1 and 20 characters"),
];

// ======== ROOM TYPES routes ========
router.get("/room-types", authenticateToken, roomController.getRoomTypes);
router.post(
  "/room-types",
  authenticateToken,
  requireStaff,
  createRoomTypeValidation,
  validationMiddleware,
  roomController.createRoomType,
);
// Update room type (Staff+ only)
router.put(
  "/room-types/:id",
  authenticateToken,
  requireStaff,
  createRoomTypeValidation,
  validationMiddleware,
  roomController.updateRoomType,
);
// Delete room type (Staff+ only)
router.delete("/room-types/:id", authenticateToken, requireStaff, roomController.deleteRoomType);

// ======== ROOMS routes ========
router.get("/rooms", authenticateToken, roomController.getRooms);
// Available rooms
router.get("/rooms/available", authenticateToken, roomController.getAvailableRooms);
// Creaete room (Staff+ only)
router.post(
  "/rooms",
  authenticateToken,
  requireStaff,
  createRoomValidation,
  validationMiddleware,
  roomController.createRoom,
);
// Update room (Staff+ only)
router.put(
  "/rooms/:id",
  authenticateToken,
  requireStaff,
  createRoomValidation,
  validationMiddleware,
  roomController.updateRoom,
);
// Delete room (Staff+ only)
router.delete("/rooms/:id", authenticateToken, requireStaff, roomController.deleteRoom);

// ======== BEDS routes ========
// Get all beds by room ID
router.get("/rooms/:roomId/beds", authenticateToken, roomController.getBedsByRoom);
// Create bed (Staff+ only)
router.post(
  "/rooms/:roomId/beds",
  authenticateToken,
  requireStaff,
  createBedValidation,
  validationMiddleware,
  roomController.createBed,
);
// Update bed (Staff+ only)
router.put(
  "/rooms/:roomId/beds/:bedId",
  authenticateToken,
  requireStaff,
  createBedValidation,
  validationMiddleware,
  roomController.updateBed,
);
// Delete bed (Staff+ only)
router.delete(
  "/rooms/:roomId/beds/:bedId",
  authenticateToken,
  requireStaff,
  roomController.deleteBed
);

export default router;
