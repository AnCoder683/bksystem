import { prisma } from "../../config/prisma";
import { Prisma, type Room } from "../../generated/prisma/client";
import { AppError } from "../../shared/utils/app-error";
import type { CreateRoomInput, UpdateRoomInput } from "./room.schema";

// Đổi lỗi Prisma đã lường trước thành AppError; lỗi khác ném nguyên cho errorHandler (500).
//   P2002: vi phạm unique (trùng name)
//   P2025: update/delete không tìm thấy dòng khớp where
const mapPrismaError = (err: unknown): never => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      throw new AppError("CONFLICT", "Tên phòng đã tồn tại");
    }
    if (err.code === "P2025") {
      throw new AppError("NOT_FOUND", "Không tìm thấy phòng");
    }
  }
  throw err;
};

const list = async (): Promise<Room[]> => {
  return prisma.room.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });
};

const getById = async (id: string): Promise<Room> => {
  // findFirst (không phải findUnique) vì where có thêm isActive, không chỉ khoá unique.
  const room = await prisma.room.findFirst({ where: { id, isActive: true } });
  if (!room) {
    throw new AppError("NOT_FOUND", "Không tìm thấy phòng");
  }
  return room;
};

const create = async (input: CreateRoomInput): Promise<Room> => {
  try {
    return await prisma.room.create({ data: input });
  } catch (err) {
    return mapPrismaError(err);
  }
};

const update = async (id: string, input: UpdateRoomInput): Promise<Room> => {
  // exactOptionalPropertyTypes: Zod `.partial()` cho kiểu `name?: string | undefined`,
  // Prisma không nhận undefined tường minh -> chỉ gán field thật sự có (cùng lý do với `details` ở AppError).
  const data: Prisma.RoomUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.capacity !== undefined) data.capacity = input.capacity;

  try {
    // where có isActive: phòng đã xoá mềm coi như không tồn tại -> P2025 -> 404.
    return await prisma.room.update({ where: { id, isActive: true }, data });
  } catch (err) {
    return mapPrismaError(err);
  }
};

const remove = async (id: string): Promise<void> => {
  try {
    await prisma.room.update({ where: { id, isActive: true }, data: { isActive: false } });
  } catch (err) {
    mapPrismaError(err);
  }
};

export const roomService = { list, getById, create, update, remove };
