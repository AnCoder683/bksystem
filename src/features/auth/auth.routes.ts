// Bước C: khai báo đường dẫn + middleware, trỏ tới controller (như "mục lục" của API auth)
import { Router } from "express";
import { authenticate } from "../../shared/middlewares/authenticate";
import { validate } from "../../shared/middlewares/validate";
import { loginSchema, registerSchema } from "./auth.schema";
import { authController } from "./auth.controller";

export const authRouter = Router();

authRouter.post("/register", validate(registerSchema), authController.register);
authRouter.post("/login", validate(loginSchema), authController.login);
authRouter.get("/me", authenticate, authController.me);
