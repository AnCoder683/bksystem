import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../app";

// Test trên app thật nhưng chỉ chạm các lớp chặn TRƯỚC service (validate, authenticate),
// nên không cần DB. Các luồng chạm DB (register thành công, email trùng, login) để sau.

describe("POST /auth/register", () => {
  it("confirmPassword không khớp thì trả 400 INVALID_REQUEST gắn vào field confirmPassword", async () => {
    const res = await request(app).post("/auth/register").send({
      email: "a@example.com",
      password: "123456",
      confirmPassword: "654321",
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_REQUEST");
    expect(res.body.error.details[0].field).toBe("confirmPassword");
  });

  it("email sai định dạng thì trả 400 INVALID_REQUEST gắn vào field email", async () => {
    const res = await request(app).post("/auth/register").send({
      email: "khong-phai-email",
      password: "123456",
      confirmPassword: "123456",
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_REQUEST");
    expect(res.body.error.details[0].field).toBe("email");
  });
});

describe("GET /auth/me", () => {
  it("không có token thì trả 401 TOKEN_INVALID", async () => {
    const res = await request(app).get("/auth/me");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("TOKEN_INVALID");
  });
});
