// Piece 4: validate (cổng kiểm tra dữ liệu client gửi lên, lúc runtime)
//
// Dependency: AppError (Piece 2) + ErrorDetail (Piece 1). Không tự trả response:
// chỉ ném AppError, errorHandler (Piece 5) là nơi duy nhất quyết định JSON trả về.
//
// Hiện chỉ kiểm tra req.body (YAGNI). Khi route cần kiểm tra query/params thì mở rộng,
// lưu ý Express 5: req.query là getter không có setter, không gán thẳng được.
import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { AppError } from "../utils/app-error";

// validate không phải middleware: nó nhận schema và TRẢ VỀ middleware,
// để mỗi route có một middleware riêng "nhớ" schema của route đó.
export function validate(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    // safeParse không ném lỗi, trả { success, data | error } để mình tự xử lý.
    const result = schema.safeParse(req.body);

    if (!result.success) {
      // Mỗi lỗi Zod có path (trường nào sai) và message -> ErrorDetail { field, reason }.
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        reason: issue.message,
      }));
      throw new AppError("INVALID_REQUEST", "Dữ liệu không hợp lệ", details);
    }

    // Dữ liệu đã làm sạch (ép kiểu, bỏ trường thừa) thay cho dữ liệu thô.
    req.body = result.data;
    next();
  };
}
