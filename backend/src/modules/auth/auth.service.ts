import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/AppError.js";
import { signAccessToken } from "../../utils/jwt.js";
import { tokensMatch } from "../../utils/tokenCompare.js";
import { RefreshSession } from "./refreshSession.model.js";
import { User, type UserDocument } from "../users/user.model.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";

const refreshLifetimeMs = 7 * 24 * 60 * 60 * 1000;
const invalidCredentials = () =>
  new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");

function hashRefreshSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

function createRefreshToken(sessionId: string): {
  token: string;
  secretHash: string;
} {
  const secret = randomBytes(32).toString("base64url");
  return {
    token: `${sessionId}.${secret}`,
    secretHash: hashRefreshSecret(secret),
  };
}

function splitRefreshToken(token: string): { sessionId: string; secret: string } | null {
  const separator = token.indexOf(".");
  if (separator <= 0 || separator === token.length - 1) {
    return null;
  }
  const sessionId = token.slice(0, separator);
  const secret = token.slice(separator + 1);
  if (!/^[\da-f]{24}$/i.test(sessionId) || !/^[\w-]+$/.test(secret)) {
    return null;
  }
  return {
    sessionId,
    secret,
  };
}

async function issueRefreshSession(userId: string): Promise<string> {
  const session = new RefreshSession({
    userId,
    tokenHash: "pending",
    expiresAt: new Date(Date.now() + refreshLifetimeMs),
  });
  const refresh = createRefreshToken(session.id);
  session.tokenHash = refresh.secretHash;
  await session.save();
  return refresh.token;
}

function createSessionResponse(user: UserDocument) {
  return {
    accessToken: signAccessToken(user._id.toString()),
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      ...(user.agency ? { agency: user.agency } : {}),
      ...(user.position ? { position: user.position } : {}),
      ...(user.state ? { state: user.state } : {}),
      ...(user.district ? { district: user.district } : {}),
    },
  };
}

export async function register(input: RegisterInput) {
  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);
  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    role: "LRB",
    ...(input.agency ? { agency: input.agency } : {}),
    ...(input.position ? { position: input.position } : {}),
    state: input.state,
    district: input.district,
  });

  const refreshToken = await issueRefreshSession(user.id);
  return { ...createSessionResponse(user), refreshToken };
}

export async function login(input: LoginInput) {
  const user = await User.findOne({ email: input.email, isDeleted: false })
    .select("+passwordHash");
  if (!user || !user.passwordHash || !user.isActive) {
    throw invalidCredentials();
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw invalidCredentials();
  }

  const refreshToken = await issueRefreshSession(user.id);
  return { ...createSessionResponse(user), refreshToken };
}

export async function refresh(token: string) {
  const parsed = splitRefreshToken(token);
  if (!parsed) {
    throw new AppError(401, "TOKEN_INVALID", "Refresh token is invalid.");
  }

  const session = await RefreshSession.findById(parsed.sessionId)
    .select("+tokenHash");
  if (!session) {
    throw new AppError(401, "TOKEN_INVALID", "Refresh token is invalid.");
  }

  const presentedHash = hashRefreshSecret(parsed.secret);
  if (!tokensMatch(presentedHash, session.tokenHash)) {
    if (!session.revokedAt) {
      session.revokedAt = new Date();
      await session.save();
    }
    throw new AppError(401, "TOKEN_INVALID", "Refresh token is invalid.");
  }

  const now = new Date();
  if (
    session.revokedAt
    || session.isDeleted
    || session.expiresAt <= now
  ) {
    throw new AppError(401, "TOKEN_INVALID", "Refresh token is invalid.");
  }

  const user = await User.findOne({
    _id: session.userId,
    isDeleted: false,
    isActive: true,
  });
  if (!user) {
    session.revokedAt = now;
    await session.save();
    throw new AppError(401, "TOKEN_INVALID", "Refresh token is invalid.");
  }

  const nextRefresh = createRefreshToken(session.id);
  const rotation = await RefreshSession.updateOne(
    {
      _id: session.id,
      tokenHash: session.tokenHash,
      revokedAt: null,
      expiresAt: { $gt: now },
      isDeleted: false,
    },
    { $set: { tokenHash: nextRefresh.secretHash, expiresAt: new Date(now.getTime() + refreshLifetimeMs) } },
  );

  if (rotation.modifiedCount !== 1) {
    throw new AppError(401, "TOKEN_INVALID", "Refresh token is invalid.");
  }

  return { ...createSessionResponse(user), refreshToken: nextRefresh.token };
}

export async function logout(token?: string): Promise<void> {
  if (!token) {
    return;
  }

  const parsed = splitRefreshToken(token);
  if (!parsed) {
    return;
  }

  await RefreshSession.updateOne(
    { _id: parsed.sessionId, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
}

export async function authenticateUser(userId: string) {
  const user = await User.findOne({
    _id: userId,
    isDeleted: false,
    isActive: true,
  });

  if (!user) {
    throw new AppError(401, "TOKEN_INVALID", "User session is no longer valid.");
  }

  return user;
}

export const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/api/v1/auth",
  maxAge: refreshLifetimeMs,
};
