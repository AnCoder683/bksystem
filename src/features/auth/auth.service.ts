// Bước B: logic nghiệp vụ register/login (tầng service: không biết gì về req/res)
//
// Ném AppError khi lỗi đã lường trước; errorHandler lo phần trả JSON.
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/prisma";
import { Prisma } from "../../generated/prisma/client";
import { env } from "../../config/env";
import { AppError } from "../../shared/utils/app-error";
import type { LoginInput, RegisterInput } from "./auth.schema";

// TODO(human): viết thân 2 hàm register và login.

// Trả về { id, email } của user vừa tạo (không trả passwordHash).
const register = async (
  input: RegisterInput,
): Promise<{ id: string; email: string }> => {
  const { email, password } = input;
  const userRole = await prisma.role.findUnique({
    where: {
      name: "USER",
    },
  });

  if (!userRole) {
    throw new Error("Hiện không có role USER");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const newUser = await prisma.user.create({
      data: { email, passwordHash, roleId: userRole.id },
    });
    return { id: newUser.id, email: newUser.email };
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new AppError("CONFLICT", "Email đã được sử dụng");
    }
    throw err;
  }
};

// ===== login =====
// Trả về: { accessToken }
//  1. Tìm user theo email (kèm role nếu muốn nhét vào token, hoặc chỉ nhét userId — tự cân nhắc trade-off).
//  2. Sai email HOẶC sai password -> CÙNG 1 AppError("UNAUTHORIZED", "Email hoặc mật khẩu không đúng").
//     Chú ý: nếu email không tồn tại thì không có hash để so -> vẫn phải ra cùng lỗi. (Bonus: timing attack —
//     email không tồn tại trả về nhanh hơn vì bỏ qua bcrypt.compare. MVP có thể chấp nhận, nhưng hãy biết nó tồn tại.)
//  3. `bcrypt.compare(plain, hash)` trả Promise<boolean>.
//  4. Ký JWT: `jwt.sign(payload, env.jwtSecret, { expiresIn: "15m" })`.
//     payload tối thiểu: { sub: user.id }. `sub` (subject) là claim chuẩn của JWT = "token này nói về ai".
//     Đừng nhét passwordHash/email nhạy cảm vào payload: JWT chỉ được MÃ HOÁ BASE64, ai cũng đọc được.
const login = async (
  input: LoginInput,
): Promise<{ accessToken: string }> => {
  const { email, password } = input;
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new AppError("UNAUTHORIZED", "Sai tài khoản hoặc mật khẩu");
  }

  const checkPassword = await bcrypt.compare(password, user.passwordHash);

  if (!checkPassword) {
    throw new AppError("UNAUTHORIZED", "Sai tài khoản hoặc mật khẩu");
  }

  const accessToken = jwt.sign({ sub: user.id }, env.jwtSecret, {
    expiresIn: "15m",
  });

  return { accessToken };
};

const getMe = async (
  userId: string,
): Promise<{ id: string; email: string; role: string }> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: { select: { name: true } } },
  });

  // Token còn hợp lệ nhưng user đã bị xoá khỏi DB -> không còn ai để trả về.
  if (!user) {
    throw new AppError("UNAUTHORIZED", "Tài khoản không tồn tại");
  }

  return { id: user.id, email: user.email, role: user.role.name };
};

export const authService = { register, login, getMe };
