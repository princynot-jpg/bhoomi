import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AppError } from "../../utils/AppError.js";
import { cookieOptions, login, logout, refresh, register } from "./auth.service.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";

const authRouter = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many authentication attempts." },
  },
});

authRouter.use(authLimiter);

authRouter.post(
  "/register",
  validateBody(registerSchema),
  asyncHandler(async (request, response) => {
    try {
      const result = await register(request.body);
      response.cookie("refreshToken", result.refreshToken, cookieOptions);
      response.status(201).json({
        success: true,
        data: { accessToken: result.accessToken, user: result.user },
      });
    } catch (error) {
      if (
        typeof error === "object"
        && error !== null
        && "code" in error
        && error.code === 11000
      ) {
        throw new AppError(409, "CONFLICT", "An account with this email already exists.");
      }
      throw error;
    }
  }),
);

authRouter.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(async (request, response) => {
    const result = await login(request.body);
    response.cookie("refreshToken", result.refreshToken, cookieOptions);
    response.json({
      success: true,
      data: { accessToken: result.accessToken, user: result.user },
    });
  }),
);

authRouter.post(
  "/refresh",
  asyncHandler(async (request, response) => {
    const token = request.cookies?.refreshToken;
    if (typeof token !== "string") {
      throw new AppError(401, "TOKEN_INVALID", "A valid refresh token is required.");
    }
    const result = await refresh(token);
    response.cookie("refreshToken", result.refreshToken, cookieOptions);
    response.json({
      success: true,
      data: { accessToken: result.accessToken, user: result.user },
    });
  }),
);

authRouter.post(
  "/logout",
  asyncHandler(async (request, response) => {
    await logout(request.cookies?.refreshToken);
    response.clearCookie("refreshToken", cookieOptions);
    response.json({ success: true, data: { loggedOut: true } });
  }),
);

export { authRouter };
