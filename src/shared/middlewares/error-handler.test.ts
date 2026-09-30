import { NextFunction, Request, Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorDetail } from "../types/api-response";
import { AppError } from "../utils/app-error";
import { errorHandler } from "./error-handler";

describe("errorHandler", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lỗi lường trước không có details", () => {
    const err = new AppError("FORBIDDEN", "Lỗi");
    // res cần có phương thức status và sau đó giá trị trả về của res.status cần có phương thức json
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json }); // res.status trả về một obj có phương thức là json {json: json}
    const req = {} as Request;
    const res = { status } as unknown as Response;
    const next = vi.fn() as NextFunction;

    errorHandler(err, req, res, next);

    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Lỗi",
      },
    });
  });

  it("lỗi lường trước có details", () => {
    const details: ErrorDetail[] = [{ field: "someField", reason: "Lỗi" }];
    const err = new AppError("INVALID_REQUEST", "Lỗi", details);
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const req = {} as Request;
    const res = { status } as unknown as Response;
    const next = vi.fn() as NextFunction;

    errorHandler(err, req, res, next);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: "INVALID_REQUEST",
        message: "Lỗi",
        details: [
          {
            field: "someField",
            reason: "Lỗi",
          },
        ],
      },
    });
  });

  it("lỗi không lường trước", () => {
    const err = new Error("Lỗi bất ngờ");
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const req = {} as Request;
    const res = { status } as unknown as Response;
    const next = vi.fn() as NextFunction;
    // TODO(human): gắn spy vào console.error + chặn in ra terminal (Arrange),
    vi.spyOn(console, "error").mockImplementation(() => {});
    // thêm Assert log ở cuối it, và afterEach restore ở đầu describe (nhớ import)

    errorHandler(err, req, res, next);

    expect(console.error).toHaveBeenCalledWith(err);
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Lỗi máy chủ",
      },
    });
  });

  it("response đã gửi một phần (headersSent) thì giao lại cho Express qua next(err)", () => {
    const err = new AppError("FORBIDDEN", "Lỗi");
    const status = vi.fn();
    const req = {} as Request;
    const res = { headersSent: true, status } as unknown as Response;
    const next = vi.fn() as NextFunction;

    errorHandler(err, req, res, next);

    expect(next).toHaveBeenCalledWith(err);
    expect(status).not.toHaveBeenCalled();
  });
});
