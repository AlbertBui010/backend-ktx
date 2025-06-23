import express from "express";
import { phanBoPhongController } from "../controllers/phanBoPhong.Controller.js";
import { authenticateToken, requireStaff } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authenticateToken, requireStaff, phanBoPhongController.getAll);
router.get("/:id", authenticateToken, requireStaff, phanBoPhongController.getById);
router.post("/", authenticateToken, requireStaff, phanBoPhongController.create);
router.put("/:id", authenticateToken, requireStaff, phanBoPhongController.update);
router.delete("/:id", authenticateToken, requireStaff, phanBoPhongController.delete);

export default router;