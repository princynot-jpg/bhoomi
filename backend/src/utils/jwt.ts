import jwt, { type JwtPayload } from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "./AppError.js";

export interface AccessTokenPayload extends JwtPayload {
  sub: string;
}

export function signAccessToken(userId: string): string {
  return jwt.sign({}, env.JWT_ACCESS_SECRET, {
    subject: userId,
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    issuer: "nlams-api",
    audience: "nlams-client",
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: "nlams-api",
      audience: "nlams-client",
    });

    if (typeof payload === "string" || typeof payload.sub !== "string") {
      throw new AppError(401, "TOKEN_INVALID", "Access token is invalid.");
    }

    return payload as AccessTokenPayload;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(401, "TOKEN_EXPIRED", "Access token has expired.");
    }
    throw new AppError(401, "TOKEN_INVALID", "Access token is invalid.");
  }
}
