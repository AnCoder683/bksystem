import type { RequestHandler } from "express";
import { AppError } from "../../shared/utils/app-error";
import type { CreateBookingInput } from "./booking.schema";
import { bookingService } from "./booking.service";

type IdParams = { id: string };

// Router đã có authenticate nên req.user luôn có; guard để TS narrowing (giống authController.me).
const currentUserId = (user: { id: string } | undefined): string => {
  if (!user) {
    throw new AppError("UNAUTHORIZED", "Chưa đăng nhập");
  }
  return user.id;
};

const create: RequestHandler = async (req, res) => {
  const data = await bookingService.create(currentUserId(req.user), req.body as CreateBookingInput);
  res.status(201).json({ success: true, data });
};

const listMine: RequestHandler = async (req, res) => {
  const data = await bookingService.listMine(currentUserId(req.user));
  res.status(200).json({ success: true, data });
};

const listAll: RequestHandler = async (_req, res) => {
  const data = await bookingService.listAll();
  res.status(200).json({ success: true, data });
};

const cancel: RequestHandler<IdParams> = async (req, res) => {
  const data = await bookingService.cancel(currentUserId(req.user), req.params.id);
  res.status(200).json({ success: true, data });
};

export const bookingController = { create, listMine, listAll, cancel };
