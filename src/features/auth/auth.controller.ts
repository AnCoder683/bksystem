// Controller: đọc req, gọi service, viết res. Không chứa logic nghiệp vụ (nằm ở service)
// và không khai báo đường dẫn (nằm ở routes).
//
// Express 5 tự bắt lỗi của handler async và đẩy vào errorHandler, nên không cần try/catch.
import type { RequestHandler } from "express";
import type { LoginInput, RegisterInput } from "./auth.schema";
import { AppError } from "../../shared/utils/app-error";
import { authService } from "./auth.service";

const register: RequestHandler = async (req, res) => {
  // validate đã bảo đảm hình dạng lúc runtime, nên ép kiểu ở đây là an toàn.
  const data = await authService.register(req.body as RegisterInput);
  res.status(201).json({ success: true, data });
};

const login: RequestHandler = async (req, res) => {
  const data = await authService.login(req.body as LoginInput);
  res.status(200).json({ success: true, data });
};

const me: RequestHandler = async (req, res) => {
  // authenticate đã gán req.user, nhưng TS chỉ biết nó là `... | undefined`
  // nên kiểm tra lại: nếu route bị cấu hình thiếu authenticate thì fail-closed (từ chối).
  if (!req.user) {
    throw new AppError("UNAUTHORIZED", "Chưa đăng nhập");
  }
  const data = await authService.getMe(req.user.id);
  res.status(200).json({ success: true, data });
};

export const authController = { register, login, me };
