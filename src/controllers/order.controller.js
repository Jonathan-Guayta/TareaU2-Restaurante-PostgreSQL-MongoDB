import * as service from "../services/order.service.js";

export const create = async (req, res) =>
  res.status(201).json(await service.createOrder(req.user.id, req.body));
export const mine = async (req, res) =>
  res.status(200).json({ data: await service.listMyOrders(req.user.id) });
export const setStatus = async (req, res) =>
  res.status(200).json(await service.updateStatus(req.user.id, req.params.id, req.body.status));
export const remove = async (req, res) => {
  await service.removeOrder(req.user.id, req.params.id);
  res.status(200).json({ message: "Pedido eliminado (y su calificación)" });
};
