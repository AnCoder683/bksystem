// Middleware 404: chạy khi không route nào khớp. Chỉ ném AppError, không tự res.json,
// để errorHandler vẫn là nơi duy nhất quyết định hình dạng JSON trả về.
//
// Phải đặt SAU mọi route và TRƯỚC errorHandler trong app.ts.
import type { RequestHandler } from "express";
import { AppError } from "../utils/app-error";

export const notFound: RequestHandler = (req, _res, next) => {
  next(new AppError("NOT_FOUND", `Không tìm thấy ${req.method} ${req.path}`));
};
