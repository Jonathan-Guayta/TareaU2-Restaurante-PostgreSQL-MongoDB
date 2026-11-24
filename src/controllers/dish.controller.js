import * as service from "../services/dish.service.js";

export const list = async (req, res) => {
  const data = await service.listDishes(req.query);
  res.status(200).json({ count: data.length, data });
};
export const getOne = async (req, res) => res.status(200).json(await service.getDish(req.params.id));
export const create = async (req, res) => res.status(201).json(await service.createDish(req.body));
export const update = async (req, res) =>
  res.status(200).json(await service.updateDish(req.params.id, req.body));
export const remove = async (req, res) => {
  await service.deleteDish(req.params.id);
  res.status(200).json({ message: "Plato eliminado (y sus calificaciones)" });
};
