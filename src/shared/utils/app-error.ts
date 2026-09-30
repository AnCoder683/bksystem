// Piece 2: AppError (lỗi "đã lường trước" mà mọi nơi trong app ném ra)
//
// Dependency: chỉ dựa vào contract của Piece 1 (ErrorCode, ErrorDetail).
// errorHandler (Piece 5) sẽ dùng `err instanceof AppError` để phân biệt lỗi đã
// lường trước (gửi message cho client) với bug bất ngờ (chỉ trả INTERNAL_ERROR).
import type { ErrorCode, ErrorDetail } from "../types/api-response";

// Nguồn duy nhất cho cặp code <-> status. Record<ErrorCode, number> ép phải có
// đủ MỌI code: thêm code mới vào ErrorCode mà quên dòng ở đây thì TS báo lỗi lúc build.
const STATUS_BY_CODE: Record<ErrorCode, number> = {
  INVALID_REQUEST: 400,
  TOKEN_EXPIRED: 401,
  TOKEN_INVALID: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details?: ErrorDetail[];

  constructor(code: ErrorCode, message: string, details?: ErrorDetail[]) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = STATUS_BY_CODE[code];
    // exactOptionalPropertyTypes: `details?` nghĩa là "có thể vắng mặt",
    // không được gán thẳng undefined, nên chỉ gán khi thật sự có.
    if (details !== undefined) {
      this.details = details;
    }
  }
}
