import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { env } from "../../config/env";
import { authenticate } from "./authenticate";
import { errorHandler } from "./error-handler";

// Integration test: ghép `authenticate` + `errorHandler` trên app giả, giống integration.test.ts.
// Route /private trả lại req.user để kiểm chứng middleware đã gắn đúng id.

describe("authenticate", () => {
  const testApp = express();
  testApp.get("/private", authenticate, (req, res) => {
    res.status(200).json({ user: req.user });
  });
  testApp.use(errorHandler);

  it("không có header Authorization thì trả 401 TOKEN_INVALID", async () => {
    const res = await request(testApp).get("/private");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("TOKEN_INVALID");
  });

  it("header sai dạng (không phải 'Bearer <token>') thì trả 401 TOKEN_INVALID", async () => {
    const token = jwt.sign({ sub: "user-1" }, env.jwtSecret);
 
    const res = await request(testApp)
      .get("/private")
      .set("Authorization", `Token ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("TOKEN_INVALID");
  });

  it("token ký bằng secret khác (giả mạo) thì trả 401 TOKEN_INVALID", async () => {
    const forged = jwt.sign({ sub: "user-1" }, "secret-cua-ke-gia-mao");

    const res = await request(testApp)
      .get("/private")
      .set("Authorization", `Bearer ${forged}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("TOKEN_INVALID");
  });

  it("token hết hạn thì trả 401 TOKEN_EXPIRED (khác code với token giả để FE biết đường refresh)", async () => {
    // expiresIn âm = hạn đã qua cách đây 10 giây.
    const expired = jwt.sign({ sub: "user-1" }, env.jwtSecret, {
      expiresIn: -10,
    });

    const res = await request(testApp)
      .get("/private")
      .set("Authorization", `Bearer ${expired}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("TOKEN_EXPIRED");
  });

  it("token hợp lệ thì gắn req.user.id và cho request đi tiếp", async () => {
    const token = jwt.sign({ sub: "user-1" }, env.jwtSecret, {
      expiresIn: "15m",
    });

    const res = await request(testApp)
      .get("/private")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ user: { id: "user-1" } });
  });
});
