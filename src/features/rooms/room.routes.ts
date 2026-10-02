import { Router } from "express";
import { authenticate } from "../../shared/middlewares/authenticate";
import { requirePermission } from "../../shared/middlewares/require-permission";
import { validate } from "../../shared/middlewares/validate";
import { createRoomSchema, updateRoomSchema } from "./room.schema";
import { roomController } from "./room.controller";

export const roomRouter = Router();

// Mọi route Rooms đều cần đăng nhập.
// Thứ tự trong từng route: requirePermission (403) -> validate (400) -> controller.
roomRouter.use(authenticate);

roomRouter.get("/", requirePermission("room:read"), roomController.list);
roomRouter.get("/:id", requirePermission("room:read"), roomController.getById);
roomRouter.post("/", requirePermission("room:create"), validate(createRoomSchema), roomController.create);
roomRouter.patch("/:id", requirePermission("room:update"), validate(updateRoomSchema), roomController.update);
roomRouter.delete("/:id", requirePermission("room:delete"), roomController.remove);
