// routes/webhook.routes.js
import express from "express";
import { invoiceController } from "../controllers/invoices.controller.js";

const router = express.Router();

/* Dùng express.json() để lấy body đã parse */
router.post("/payos-webhook", express.json(), invoiceController.handlePayOSWebhook);

export default router;
