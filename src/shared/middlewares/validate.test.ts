import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import { validate } from "./validate";
import { AppError } from "../utils/app-error";

describe("validate", () => {
  it("gọi next() và làm sạch req.body khi dữ liệu hợp lệ", () => {
    // Arrange
    const schema = z.object({ name: z.string() });
    const req = { body: { name: "An" } } as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    // Act
    validate(schema)(req, res, next);

    // Assert
    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ name: "An" });
  });

  it("ném AppError khi dữ liệu sai", () => {
    // Arrange
    const schema = z.object({ name: z.string() });
    const req = { body: { name: 123 } } as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    // Act + Assert
    expect(() => validate(schema)(req, res, next)).toThrow(AppError);
  });
});
