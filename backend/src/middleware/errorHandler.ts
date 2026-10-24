import type { ErrorRequestHandler, RequestHandler } from "express";
import { logger } from "../utils/logger.js";
import { AppError } from "../utils/AppError.js";

export const notFoundHandler: RequestHandler = (_request, response) => {
  response.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "The requested resource was not found." },
  });
};

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.fields ? { fields: error.fields } : {}),
      },
    });
    return;
  }

  if (error instanceof SyntaxError && "body" in error) {
    response.status(400).json({
      success: false,
      error: { code: "INVALID_REQUEST", message: "Request body contains invalid JSON." },
    });
    return;
  }

  logger.error("Unhandled request error", {
    method: request.method,
    path: request.path,
    errorName: error instanceof Error ? error.name : "UnknownError",
  });
  response.status(500).json({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." },
  });
};
