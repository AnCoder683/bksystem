// Bước D: middleware `authenticate` (cổng kiểm tra "bạn là ai" cho các route cần đăng nhập)
//
// Dependency: env.jwtSecret, AppError, jsonwebtoken, và khai báo kiểu req.user (Bước E).
//
// HINT:
// - Khác `validate`, đây là middleware thường: `export const authenticate: RequestHandler = (req, _res, next) => { ... }`
// - Đọc header: `req.headers.authorization` có dạng "Bearer <token>". Thiếu header / sai dạng -> AppError("TOKEN_INVALID", ...).
//   (Bearer = "người mang", ai cầm token thì được coi là chủ token.)
// - `jwt.verify(token, env.jwtSecret)` vừa kiểm tra chữ ký vừa kiểm tra hạn. Nó NÉM lỗi chứ không trả null:
//     * `jwt.TokenExpiredError`  -> AppError("TOKEN_EXPIRED", ...)   (FE sẽ dùng refresh token)
//     * lỗi khác (JsonWebTokenError: chữ ký sai, token hỏng) -> AppError("TOKEN_INVALID", ...)
//   Gợi ý: bọc try/catch, dùng `instanceof` để phân loại. Lưu ý lỗi nào cũng phải đổi thành AppError,
//   không để lỗi thô của thư viện lọt ra thành 500.
// - verify trả về `string | JwtPayload`: cần narrowing (thu hẹp kiểu) trước khi đọc `.sub`
//   (bạn đã học `typeof` / `in` ở phần narrowing). Nếu `sub` không phải string -> TOKEN_INVALID.
// - Thành công: gán `req.user = { id: payload.sub }` rồi gọi `next()`.

import { RequestHandler } from "express";
import { AppError } from "../utils/app-error";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";

//   Quên gọi next() thì request treo mãi — lỗi kinh điển.
export const authenticate: RequestHandler = (req, _res, next) => {
  const accessToken = req.headers.authorization;
  if (!accessToken || !accessToken.startsWith("Bearer ")) {
    throw new AppError("TOKEN_INVALID", "Token không hợp lệ");
  }

  // try/catch chỉ bọc đúng jwt.verify (chỗ duy nhất ném lỗi của thư viện).
  let payload: jwt.JwtPayload;
  try {
    // `as`: chỉ login ký token và luôn ký dạng object { sub }, nên verify trả JwtPayload.
    payload = jwt.verify(accessToken.slice(7), env.jwtSecret) as jwt.JwtPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError("TOKEN_EXPIRED", "Token hết hạn");
    }
    throw new AppError("TOKEN_INVALID", "Token không hợp lệ");
  }

  // `as string`: token do chính login ký nên luôn có sub (xem comment ở trên).
  req.user = { id: payload.sub as string };
  next();
};
