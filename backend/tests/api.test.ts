import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";

describe("backend API foundation", () => {
  it("reports liveness without requiring MongoDB", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { status: "ok" },
    });
  });

  it("reports not ready while MongoDB is disconnected", async () => {
    const response = await request(app).get("/ready");
    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe("NOT_READY");
  });

  it("validates authentication input using the standard error envelope", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({ name: "", email: "not-an-email", password: "short" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.fields).toBeDefined();
  });

  it("requires authentication for the current-user endpoint", async () => {
    const response = await request(app).get("/api/v1/users/me");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("TOKEN_INVALID");
  });

  it("requires authentication to update the current-user profile", async () => {
    const response = await request(app)
      .patch("/api/v1/users/me")
      .send({
        name: "Example User",
        position: "",
        state: "Karnataka",
        district: "Bengaluru",
        avatarDataUrl: null,
      });
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("TOKEN_INVALID");
  });

  it("rejects refresh requests without a refresh cookie", async () => {
    const response = await request(app).post("/api/v1/auth/refresh");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("TOKEN_INVALID");
  });

  it("does not allow callers to choose a privileged signup role", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Example User",
        email: "user@example.gov.in",
        password: "long-enough-password",
        state: "Karnataka",
        district: "Bengaluru",
        role: "ADMIN",
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("uses the standard not-found error envelope", async () => {
    const response = await request(app).get("/api/v1/missing");
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });
});
