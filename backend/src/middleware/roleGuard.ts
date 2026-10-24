import type { RequestHandler } from "express";
import type { UserRole } from "../modules/users/user.model.js";
import { AppError } from "../utils/AppError.js";

export function roleGuard(...allowedRoles: UserRole[]): RequestHandler {
  return (request, _response, next) => {
    if (!request.user || !allowedRoles.includes(request.user.role)) {
      next(new AppError(403, "FORBIDDEN", "You do not have permission to perform this action."));
      return;
    }
    next();
  };
}
