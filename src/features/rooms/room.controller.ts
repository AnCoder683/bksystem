import type { RequestHandler } from "express";
import type { CreateRoomInput, UpdateRoomInput } from "./room.schema";
import { roomService } from "./room.service";

// Route khai báo "/:id" nên params.id luôn có; ép kiểu vì RequestHandler mặc định không biết điều đó.
type IdParams = { id: string };

const list: RequestHandler = async (_req, res) => {
  const data = await roomService.list();
  res.status(200).json({ success: true, data });
};

const getById: RequestHandler<IdParams> = async (req, res) => {
  const data = await roomService.getById(req.params.id);
  res.status(200).json({ success: true, data });
};

const create: RequestHandler = async (req, res) => {
  const data = await roomService.create(req.body as CreateRoomInput);
  res.status(201).json({ success: true, data });
};

const update: RequestHandler<IdParams> = async (req, res) => {
  const data = await roomService.update(req.params.id, req.body as UpdateRoomInput);
  res.status(200).json({ success: true, data });
};

const remove: RequestHandler<IdParams> = async (req, res) => {
  await roomService.remove(req.params.id);
  res.status(204).end();
};

export const roomController = { list, getById, create, update, remove };
