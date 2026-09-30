// Piece 1: Response/Error format (hình dạng chuẩn của mọi response gửi cho client)
//
// File này chỉ chứa TYPE, chưa có logic chạy. Các piece sau (AppError, validate,
// errorHandler) import từ đây nên đây là "contract" của cả hạ tầng.
//
//   Thành công: { success: true,  data, meta? }
//   Lỗi:        { success: false, error: { code, message, details? } }

// Bảng mã chung với FE: mỗi code ứng với một hành động khác nhau của FE.
export type ErrorCode =
  | "INVALID_REQUEST" // sai dữ liệu đầu vào, kèm details -> FE tô đỏ từng ô
  | "TOKEN_EXPIRED" // access token hết hạn -> FE dùng refresh token xin token mới
  | "TOKEN_INVALID" // token sai/bị thu hồi -> FE bắt đăng nhập lại
  | "FORBIDDEN" // đã đăng nhập nhưng không đủ quyền
  | "NOT_FOUND" // không tìm thấy tài nguyên
  | "INTERNAL_ERROR"; // lỗi bất ngờ của server

// Một mục trong details: field nào sai và sai vì lý do gì.
export type ErrorDetail = {
  field: string;
  reason: string;
};

export type ApiErrorBody = {
  code: ErrorCode;
  message: string;
  details?: ErrorDetail[];
};

// Chỗ chừa sẵn cho phân trang (lý do chọn envelope).
export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
};

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  meta?: PaginationMeta;
};

export type ApiErrorResponse = {
  success: false;
  error: ApiErrorBody;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
