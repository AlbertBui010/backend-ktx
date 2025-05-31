import express from "express";
import { successResponse } from "../utils/response.util.js";

const router = express.Router();

router.get("/health", (req, res) => {
  return successResponse(res, { message: "API is healthy" });
});

export default router;
