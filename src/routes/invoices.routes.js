// src/routes/invoices.routes.js
import express from "express";
import { invoiceController } from "../controllers/invoices.controller.js";
import bodyParser from "body-parser"; // 👈 import thêm dòng này
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


export default router;
