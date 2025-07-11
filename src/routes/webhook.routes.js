import express from "express";
import { invoiceController } from "../controllers/invoices.controller.js";

const router = express.Router();

/* 1A. PayOS sẽ PING (HEAD/GET) trước → trả 200 */
router.head("/payos-webhook", (_, res) => res.sendStatus(200));
router.get ("/payos-webhook", (_, res) => res.status(200).json({ ok: true }));

/* 1B. Payload thật gửi bằng POST – giữ raw body để verify chữ ký */
router.post(
  "/payos-webhook",
  express.raw({ type: "application/json" }),   // chỉ bắt JSON, hạn chế overhead
  invoiceController.handlePayOSWebhook
);

export default router;
