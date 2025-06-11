import { validationResult } from "express-validator";
import { errorResponse } from "../utils/response.util.js";

export const validationMiddleware = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
      value: error.value,
    }));

    return errorResponse(res, 400, "Validation failed", formattedErrors);
  }

  next();
};
