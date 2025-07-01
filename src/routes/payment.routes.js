// src/routes/payment.routes.js
import express from "express";
import { paymentController } from "../controllers/payment.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
const router = express.Router();

// Sinh viên/nhân viên đều có thể xem chi tiết
router.get(
  "/:allocationId", 
  paymentController.getPaymentDetails
);
router.post(
  "/:allocationId/checkout",
  paymentController.createCheckout
);

// Webhook từ PayOS (không cần auth)
router.post("/payos-webhook", paymentController.handlePayOSWebhook);

export default router;
