// Bước A: schema validate cho register/login (dùng với middleware `validate` có sẵn)
//
// Không có field `role` trong registerSchema: Zod mặc định bỏ field thừa, và validate.ts gán
// req.body = result.data nên `role` client gửi lên sẽ biến mất -> chặn mass assignment.
import { z } from "zod";

export const registerSchema = z
  .object({
    email: z.email(),
    // min 6: độ dài tối thiểu. max 72: bcrypt chỉ đọc 72 byte đầu, quá thì phần sau bị bỏ qua âm thầm.
    password: z.string().min(6).max(72),
    confirmPassword: z.string(),
  })
  // refine chạy SAU khi từng field đã hợp lệ, vì cần so 2 field với nhau (check từng field riêng không làm được).
  // path chỉ định lỗi gắn vào field nào -> validate.ts trả details { field: "confirmPassword", ... } cho FE tô đỏ đúng ô.
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu nhập lại không khớp",
    path: ["confirmPassword"],
  });

// Login chỉ cần "có nhập": không áp quy tắc độ dài để khỏi lộ chính sách mật khẩu cho kẻ dò,
// và để user có mật khẩu cũ (tạo trước khi đổi quy tắc) vẫn đăng nhập được.
export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
