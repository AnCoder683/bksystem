// Piece 5: errorHandler (nơi duy nhất biến MỌI lỗi thành JSON trả về client)
//
// Dependency: AppError (Piece 2), ApiErrorResponse (Piece 1). Nhận lỗi do validate (Piece 4),
// handler async (Express 5 tự next(err), Piece 3) hoặc bug bất ngờ ném ra.
import type { ErrorRequestHandler } from "express";
import type { ApiErrorResponse } from "../types/api-response";
import { AppError } from "../utils/app-error";

// Express nhận ra middleware lỗi nhờ hàm có ĐÚNG 4 tham số, nên `_next` phải có
// dù không dùng (thiếu là Express coi như middleware thường và bỏ qua lỗi).
export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  // Response đã gửi một phần thì không thể đổi status/body nữa (res.json sẽ ném thêm lỗi).
  // Giao lại cho handler mặc định của Express, nó sẽ đóng kết nối.
  if (res.headersSent) {
    next(err);
    return;
  }

  // JSON hỏng do express.json() ném ra: lỗi của client (400), không phải bug server.
  // Nhận bằng dấu hiệu chính xác (SyntaxError + type của body-parser), không đoán theo `status`.
  // `"type" in err` để TS cho phép đọc err.type (SyntaxError gốc không khai báo trường này).
  if (
    err instanceof SyntaxError &&
    "type" in err &&
    err.type === "entity.parse.failed"
  ) {
    const body: ApiErrorResponse = {
      success: false,
      error: { code: "INVALID_REQUEST", message: "JSON không hợp lệ" },
    };
    res.status(400).json(body);
    return;
  }

  // Lỗi đã lường trước: do mình tự ném, nên code/message/details an toàn để gửi client.
  if (err instanceof AppError) {
    const body: ApiErrorResponse = {
      success: false,
      error: { code: err.code, message: err.message },
    };
    // exactOptionalPropertyTypes: chỉ gán details khi thật sự có (giống app-error.ts).
    if (err.details !== undefined) {
      body.error.details = err.details;
    }
    res.status(err.statusCode).json(body);
    return;
  }

  // Lỗi bất ngờ: message có thể lộ chi tiết nội bộ, nên chỉ ghi log ở server
  // và trả cho client thông báo chung chung.
  console.error(err);
  const body: ApiErrorResponse = {
    success: false,
    error: { code: "INTERNAL_ERROR", message: "Lỗi máy chủ" },
  };
  res.status(500).json(body);
};
