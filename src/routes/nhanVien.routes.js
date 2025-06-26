import express from "express";
import { nhanVienController } from "../controllers/nhanVien.controller.js";
import { authenticateToken, requireStaff } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authenticateToken, requireStaff, nhanVienController.getAll);
router.get("/:id", authenticateToken, requireStaff, nhanVienController.getById);
router.post("/", authenticateToken, requireStaff, nhanVienController.create);
router.put("/:id", authenticateToken, requireStaff, nhanVienController.update);
router.delete("/:id", authenticateToken, requireStaff, nhanVienController.delete);

export default router;