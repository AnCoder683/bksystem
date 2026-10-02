import { prisma } from "../../config/prisma";
import { Prisma, type Booking } from "../../generated/prisma/client";
import { AppError } from "../../shared/utils/app-error";
import { hasPermission } from "../../shared/middlewares/require-permission";
import type { CreateBookingInput } from "./booking.schema";

// Chống đặt trùng: transaction + khoá dòng Room (SELECT ... FOR UPDATE).
// Khoá Room chứ không khoá Booking: khi phòng còn trống thì chưa có dòng Booking trùng nào để khoá
// (phantom), 2 request vẫn cùng thấy "trống". Khoá Room khiến mọi lần đặt CÙNG phòng xếp hàng lần lượt;
// đặt phòng khác nhau vẫn chạy song song.
const create = async (userId: string, input: CreateBookingInput): Promise<Booking> => {
  const { roomId, startTime, endTime } = input;

  return prisma.$transaction(async (tx) => {
    // 1. Khoá dòng Room. Request thứ 2 cùng phòng sẽ ĐỨNG CHỜ ở đây tới khi transaction 1 commit/rollback.
    //    Đồng thời kiểm tra phòng tồn tại và chưa bị xoá mềm.
    const rooms = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Room" WHERE id = ${roomId} AND "isActive" = true FOR UPDATE
    `;
    if (rooms.length === 0) {
      throw new AppError("NOT_FOUND", "Không tìm thấy phòng");
    }

    // 2. Kiểm tra trùng giờ (khoảng nửa mở [start, end)): cũ.start < mới.end VÀ cũ.end > mới.start.
    //    Chỉ tính CONFIRMED: booking đã huỷ không chặn phòng.
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

    // 3. Tạo. Ném lỗi ở bước 1/2 -> Prisma rollback cả transaction và nhả khoá.
    return tx.booking.create({ data: { roomId, userId, startTime, endTime } });
  });
};

const listMine = async (userId: string): Promise<Booking[]> => {
  // Luôn lọc theo userId của người đang đăng nhập -> không bao giờ lộ booking người khác.
  return prisma.booking.findMany({
    where: { userId },
    orderBy: { startTime: "desc" },
  });
};

const listAll = async (): Promise<Booking[]> => {
  return prisma.booking.findMany({ orderBy: { startTime: "desc" } });
};

const cancel = async (userId: string, bookingId: string): Promise<Booking> => {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

  // Ownership check (chống IDOR): không phải chủ và không có quyền :any -> 404 như không tồn tại,
  // để không xác nhận cho người lạ biết booking này có thật.
  const isOwner = booking?.userId === userId;
  if (!booking || (!isOwner && !(await hasPermission(userId, "booking:cancel:any")))) {
    throw new AppError("NOT_FOUND", "Không tìm thấy booking");
  }

  if (booking.status === "CANCELLED") {
    throw new AppError("CONFLICT", "Booking đã được huỷ trước đó");
  }

  try {
    // where có status CONFIRMED: 2 request huỷ cùng lúc thì request sau không khớp -> P2025.
    return await prisma.booking.update({
      where: { id: bookingId, status: "CONFIRMED" },
      data: { status: "CANCELLED" },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      throw new AppError("CONFLICT", "Booking đã được huỷ trước đó");
    }
    throw err;
  }
};

export const bookingService = { create, listMine, listAll, cancel };
