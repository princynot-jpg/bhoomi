import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import { env } from "./config/env.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { workspaceRouter } from "./modules/workspace/workspace.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { AppError } from "./utils/AppError.js";

const app = express();

function sanitizeMongoInput(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(sanitizeMongoInput);
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete (value as Record<string, unknown>)[key];
    } else {
      sanitizeMongoInput(nestedValue);
    }
  }
}

function mongoSanitizeRequest(
  request: express.Request,
  _response: express.Response,
  next: express.NextFunction,
): void {
  sanitizeMongoInput(request.body);
  const queryStart = request.url.indexOf("?");
  if (queryStart !== -1) {
    const url = new URL(request.url, "http://localhost");
    for (const key of [...url.searchParams.keys()]) {
      if (key.startsWith("$") || key.includes(".")) {
        url.searchParams.delete(key);
      }
    }
    request.url = `${url.pathname}${url.search}`;
  }
  next();
}

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || env.CORS_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new AppError(403, "FORBIDDEN", "Origin is not allowed by CORS."));
  },
}));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));
app.use(cookieParser());
app.use(mongoSanitizeRequest);

app.get("/health", (_request, response) => {
  response.json({ success: true, data: { status: "ok" } });
});

app.get("/ready", (_request, response) => {
  if (mongoose.connection.readyState !== 1) {
    response.status(503).json({
      success: false,
      error: { code: "NOT_READY", message: "Database connection is not ready." },
    });
    return;
  }
  response.json({ success: true, data: { status: "ready" } });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/workspace", workspaceRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
