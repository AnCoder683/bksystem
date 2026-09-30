import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AppError } from "../utils/app-error";
import { errorHandler } from "./error-handler";
import { validate } from "./validate";

// Integration test: ghép middleware với Express thật trên app giả dựng riêng trong file này,
// không chạm vào `app` thật (test app thật nằm ở src/app.test.ts).

describe("route async ném lỗi", () => {
  it("errorHandler bắt được (không cần asyncHandler, Express 5 tự next(err)) và trả đúng JSON", async () => {
    const testApp = express();
    testApp.get("/boom", async () => {
      throw new AppError("NOT_FOUND", "không thấy");
    });
    testApp.use(errorHandler);

    const res = await request(testApp).get("/boom");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: { code: "NOT_FOUND", message: "không thấy" },
    });
  });
});

describe("POST /users với validate + errorHandler", () => {
  const schema = z.object({ name: z.string() });

  const testApp = express();
  testApp.use(express.json());
  testApp.post("/users", validate(schema), (req, res) => {
    res.status(201).json(req.body);
  });
  testApp.use(errorHandler);

  it("body sai thì trả 400 INVALID_REQUEST kèm details", async () => {
    const res = await request(testApp).post("/users").send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_REQUEST");
    expect(res.body.error.details[0].field).toBe("name");
  });

  it("body đúng thì trả 201 và bỏ trường thừa (chặn mass assignment)", async () => {
    const res = await request(testApp)
      .post("/users")
      .send({ name: "An", role: "admin" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ name: "An" });
  });

  it("JSON hỏng thì trả 400 INVALID_REQUEST (lỗi của client, không phải 500)", async () => {
    // Gửi chuỗi thô thiếu ngoặc, kèm header báo đây là JSON để express.json() thử parse.
    const res = await request(testApp)
      .post("/users")
      .set("Content-Type", "application/json")
      .send('{"name":');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      error: { code: "INVALID_REQUEST", message: "JSON không hợp lệ" },
    });
  });
});
