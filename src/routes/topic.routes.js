import express from "express";
import { body, param } from "express-validator";
import { topicController } from "../controllers/topic.controller.js";
import { authenticateToken, requireStaff } from "../middleware/auth.middleware.js";
import { validationMiddleware } from "../middleware/validation.middleware.js";

const router = express.Router();

// ======== CHU DE (TOPIC) ========
router.get("/topics", authenticateToken, topicController.getAllTopics);
router.post(
  "/topics",
  authenticateToken,
  requireStaff,
  body("ten_chu_de").notEmpty().withMessage("Tên chủ đề là bắt buộc"),
  validationMiddleware,
  topicController.createTopic
);
router.put(
  "/topics/:id",
  authenticateToken,
  requireStaff,
  param("id").isInt(),
  body("ten_chu_de").optional().notEmpty(),
  validationMiddleware,
  topicController.updateTopic
);
router.delete(
  "/topics/:id",
  authenticateToken,
  requireStaff,
  param("id").isInt(),
  validationMiddleware,
  topicController.deleteTopic
);

// ======== BANG TIN (NEWS) ========
router.get("/news", authenticateToken, topicController.getAllBangTin);
router.post(
  "/news",
  authenticateToken,
  requireStaff,
  body("tieu_de").notEmpty().withMessage("Tiêu đề là bắt buộc"),
  body("noi_dung").notEmpty().withMessage("Nội dung là bắt buộc"),
  body("id_chu_de").isInt().withMessage("ID chủ đề là bắt buộc").notEmpty(), // <-- Thêm validation cho id_chu_de
  validationMiddleware,
  topicController.createBangTin
);
router.put(
  "/news/:id",
  authenticateToken,
  requireStaff,
  param("id").isInt(),
  // Có thể thêm optional validation cho id_chu_de nếu bạn cho phép thay đổi topic khi update
  body("id_chu_de").optional().isInt().withMessage("ID chủ đề phải là số nguyên"),
  validationMiddleware,
  topicController.updateBangTin
);
router.delete(
  "/news/:id",
  authenticateToken,
  requireStaff,
  param("id").isInt(),
  validationMiddleware,
  topicController.deleteBangTin
);


export default router;
