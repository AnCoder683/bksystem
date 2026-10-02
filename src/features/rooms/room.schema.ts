import { z } from "zod";

export const createRoomSchema = z.object({
  name: z.string().trim().min(1).max(100),
  capacity: z.int().min(1).max(1000),
});

// PATCH: sửa một phần, mọi field đều optional nhưng phải gửi ít nhất 1 field.
export const updateRoomSchema = createRoomSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Cần ít nhất một trường để cập nhật",
  });

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
