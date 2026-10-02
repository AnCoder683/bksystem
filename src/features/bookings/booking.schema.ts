import { z } from "zod";

// ISO 8601 bắt buộc có múi giờ (vd 2026-10-05T09:00:00+07:00), rồi đổi thành Date.
const isoDateTime = z.iso.datetime({ offset: true }).transform((s) => new Date(s));

export const createBookingSchema = z
  .object({
    roomId: z.string().min(1),
    startTime: isoDateTime,
    endTime: isoDateTime,
  })
  // Khoảng nửa mở [start, end): end phải lớn hơn hẳn start.
  .refine((data) => data.endTime > data.startTime, {
    message: "endTime phải sau startTime",
    path: ["endTime"],
  })
  .refine((data) => data.startTime > new Date(), {
    message: "Không thể đặt phòng trong quá khứ",
    path: ["startTime"],
  });

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
