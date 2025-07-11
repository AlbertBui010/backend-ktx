import express from "express";
import { phanBoPhongController } from "../controllers/phanBoPhong.Controller.js";
import { authenticateToken, requireStaff } from "../middleware/auth.middleware.js";

const router = express.Router();

/* 1) Route dành cho sinh viên – KHÔNG requireStaff
   👉 đặt TRƯỚC "/:id" */
router.get(
  "/active",
  authenticateToken,
  phanBoPhongController.getActiveAllocation
);

/* 2) Các route dành cho staff */
router.get("/", authenticateToken, requireStaff, phanBoPhongController.getAll);
router.get("/:id", authenticateToken, requireStaff, phanBoPhongController.getById);
router.post("/", authenticateToken, requireStaff, phanBoPhongController.create);
router.put("/:id", authenticateToken, requireStaff, phanBoPhongController.update);
router.delete("/:id", authenticateToken, requireStaff, phanBoPhongController.delete);

export default router;
