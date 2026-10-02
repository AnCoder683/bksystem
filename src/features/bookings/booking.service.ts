import { prisma } from "../../config/prisma";
import type { Booking } from "../../generated/prisma/client";
import { AppError } from "../../shared/utils/app-error";
import type { CreateBookingInput } from "./booking.schema";

// Chống double-booking bằng transaction + row lock trên dòng Room.
// Mọi lượt đặt CÙNG một phòng phải xếp hàng qua lock -> không còn khe check-then-act.
const create = async (userId: string, input: CreateBookingInput): Promise<Booking> => {
  const { roomId, startTime, endTime } = input;

  // Interactive transaction: mọi query bên trong PHẢI dùng `tx`, không dùng `prisma`
  // (dùng `prisma` = connection khác, nằm ngoài transaction, không thấy lock).
  return prisma.$transaction(async (tx) => {
    // 1. Khoá dòng Room. Prisma không có cú pháp FOR UPDATE -> raw SQL.
    //    Tagged template `$queryRaw\`...${x}\`` tự tham số hoá (chống SQL injection),
    //    KHÔNG dùng $queryRawUnsafe với chuỗi ghép tay.
    //    Request khác cùng roomId sẽ CHỜ ở dòng này tới khi transaction này commit/rollback.
    const rooms = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Room"
      WHERE id = ${roomId} AND "isActive" = true
      FOR UPDATE
    `;
    if (rooms.length === 0) {
      throw new AppError("NOT_FOUND", "Không tìm thấy phòng");
    }

    // 2. Kiểm tra trùng giờ, SAU khi đã giữ lock.
    //    Hai khoảng [s1,e1) và [s2,e2) trùng khi s1 < e2 VÀ e1 > s2.
    //    Chỉ booking CONFIRMED mới chặn phòng (booking đã huỷ thì không).
    const overlap = await tx.booking.findFirst({
      where: {
        roomId,
        status: "CONFIRMED",
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
      select: { id: true },
    });
    if (overlap) {
      throw new AppError("CONFLICT", "Phòng đã được đặt trong khoảng thời gian này");
    }

    // 3. Tạo booking. Callback trả về -> Prisma commit -> lock được nhả.
    //    Ném lỗi ở bất kỳ bước nào -> rollback, lock cũng được nhả.
    return tx.booking.create({
      data: { roomId, userId, startTime, endTime },
    });
  });
};

export const bookingService = { create };
