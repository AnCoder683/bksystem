import { z } from "zod";

// Bắt buộc có múi giờ (Z hoặc +07:00) để không hiểu nhầm giờ địa phương; transform sang Date cho service.
const isoDateTime = z.iso.datetime({ offset: true }).transform((s) => new Date(s));

export const createBookingSchema = z
  .object({
    roomId: z.uuid(),
    startTime: isoDateTime,
    endTime: isoDateTime,
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "Giờ kết thúc phải sau giờ bắt đầu",
    path: ["endTime"],
  })
  .refine((data) => data.startTime > new Date(), {
    message: "Không thể đặt phòng trong quá khứ",
    path: ["startTime"],
  });

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
