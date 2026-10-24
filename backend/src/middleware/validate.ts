import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { AppError } from "../utils/AppError.js";

export function validateBody(schema: ZodType): RequestHandler {
  return (request, _response, next) => {
    const result = schema.safeParse(request.body);
    if (!result.success) {
      const fields: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join(".") || "body";
        fields[path] ??= [];
        fields[path].push(issue.message);
      }
      next(new AppError(400, "VALIDATION_ERROR", "Request validation failed.", fields));
      return;
    }

    request.body = result.data;
    next();
  };
}
