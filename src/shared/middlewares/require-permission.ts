// Rooms bước 2: middleware `requirePermission` (cổng kiểm tra "bạn được làm gì")
//
// Dependency: prisma (src/config/prisma), AppError, và req.user do `authenticate` gán.
// Luôn đặt SAU authenticate trong route:
//   router.post("/rooms", authenticate, requirePermission("room:create"), ...)
//
// Quyết định đã chốt: tra DB mỗi request (không nhét quyền vào JWT) -> đổi quyền có hiệu lực ngay,
// đánh đổi thêm 1 query/request.

import { RequestHandler } from "express";
import { prisma } from "../../config/prisma";
import { AppError } from "../utils/app-error";

// Factory: `action` được closure giữ lại, mỗi route tạo một middleware với quyền riêng.
export const requirePermission = (action: string): RequestHandler => {
  return async (req, _res, next) => {
    // Chỉ xảy ra khi route quên đặt `authenticate` phía trước. Guard này cũng narrowing req.user.
    if (!req.user) {
      throw new AppError("UNAUTHORIZED", "Vui lòng đăng nhập");
    }

    // Để DB trả lời có/không (`some` -> EXISTS trong SQL), không kéo cả danh sách quyền về.
    // User bị xoá (token còn hạn) cũng ra 0 -> rơi vào 403, không cần nhánh null riêng.
    const count = await prisma.user.count({
      where: {
        id: req.user.id,
        role: {
          rolePermissions: {
            some: { permission: { action } },
          },
        },
      },
    });

    if (count === 0) {
      throw new AppError("FORBIDDEN", "Bạn không có quyền thực hiện thao tác này");
    }

    next();
  };
};
