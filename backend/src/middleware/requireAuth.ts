import type { RequestHandler } from "express";
import { authenticateUser } from "../modules/auth/auth.service.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyAccessToken } from "../utils/jwt.js";

export const requireAuth: RequestHandler = asyncHandler(async (request, _response, next) => {
  const authorization = request.header("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new AppError(401, "TOKEN_INVALID", "A valid access token is required.");
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) {
    throw new AppError(401, "TOKEN_INVALID", "A valid access token is required.");
  }

  const payload = verifyAccessToken(token);
  const user = await authenticateUser(payload.sub);
  request.user = {
    id: user.id,
    role: user.role,
    ...(user.agency ? { agency: user.agency } : {}),
    ...(user.state ? { state: user.state } : {}),
    ...(user.district ? { district: user.district } : {}),
  };
  next();
});
