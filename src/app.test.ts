import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "./app";

describe("GET /health", () => {
  it("trả 200 và { status: 'ok' }", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("route không tồn tại", () => {
  it("trả 404 NOT_FOUND dạng JSON thay vì HTML mặc định của Express", async () => {
    const res = await request(app).get("/khong-ton-tai");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: { code: "NOT_FOUND", message: "Không tìm thấy GET /khong-ton-tai" },
    });
  });
});
