import { Router } from "express";
import { authenticate } from "../../shared/middlewares/authenticate";
import { requirePermission } from "../../shared/middlewares/require-permission";
import { validate } from "../../shared/middlewares/validate";
import { createBookingSchema } from "./booking.schema";
import { bookingController } from "./booking.controller";

export const bookingRouter = Router();

bookingRouter.use(authenticate);

bookingRouter.post("/", requirePermission("booking:create"), validate(createBookingSchema), bookingController.create);
