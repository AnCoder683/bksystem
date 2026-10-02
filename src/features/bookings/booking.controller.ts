import type { RequestHandler } from "express";
import { AppError } from "../../shared/utils/app-error";
import type { CreateBookingInput } from "./booking.schema";
import { bookingService } from "./booking.service";

const create: RequestHandler = async (req, res) => {
  if (!req.user) {
    throw new AppError("UNAUTHORIZED", "Chưa đăng nhập");
  }
  const data = await bookingService.create(req.user.id, req.body as CreateBookingInput);
  res.status(201).json({ success: true, data });
};

export const bookingController = { create };
