import { Router } from "express";
import { authenticate } from "../../shared/middlewares/authenticate";
import { requirePermission } from "../../shared/middlewares/require-permission";
import { validate } from "../../shared/middlewares/validate";
import { createBookingSchema } from "./booking.schema";
import { bookingController } from "./booking.controller";

export const bookingRouter = Router();

bookingRouter.use(authenticate);

bookingRouter.post("/", requirePermission("booking:create"), validate(createBookingSchema), bookingController.create);
// "/me" khai báo trước mọi route "/:id..." để không bị hiểu nhầm "me" là một id.
bookingRouter.get("/me", requirePermission("booking:read:own"), bookingController.listMine);
bookingRouter.get("/", requirePermission("booking:read:any"), bookingController.listAll);
// :own là cửa vào; huỷ booking của người khác cần thêm :any, kiểm tra trong service (ownership).
bookingRouter.patch("/:id/cancel", requirePermission("booking:cancel:own"), bookingController.cancel);
