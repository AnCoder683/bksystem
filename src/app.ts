import express from "express";
import { errorHandler } from "./shared/middlewares/error-handler";
import { notFound } from "./shared/middlewares/not-found";
import { authRouter } from "./features/auth/auth.routes";
import { roomRouter } from "./features/rooms/room.routes";

export const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/rooms", roomRouter);

// Thứ tự quan trọng: Express chạy middleware từ trên xuống.
// notFound đặt SAU mọi route (chỉ tới được khi không route nào khớp),
// errorHandler đặt CUỐI CÙNG để nhận mọi lỗi (kể cả lỗi do notFound tạo ra).
app.use(notFound);
app.use(errorHandler);
