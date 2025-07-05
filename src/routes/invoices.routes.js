// src/routes/invoices.routes.js
import express from "express";
import { invoiceController } from "../controllers/invoices.controller.js";
import { authenticateToken, requireStaff } from "../middleware/auth.middleware.js";

const router = express.Router();

// Nhân viên: xem tất cả hóa đơn
router.get("/", authenticateToken, requireStaff, invoiceController.getAll);

// Sinh viên: xem hóa đơn của mình
router.get("/my", authenticateToken, invoiceController.getMyInvoices);

// Sinh viên: xem chi tiết hóa đơn
router.get("/:allocationId", authenticateToken, invoiceController.getOne);

// Sinh viên: tạo checkout link
router.post("/:allocationId/checkout", authenticateToken, invoiceController.createCheckout);

// Webhook từ PayOS (không cần auth)
router.post("/payos-webhook", invoiceController.handlePayOSWebhook);

export default router;
