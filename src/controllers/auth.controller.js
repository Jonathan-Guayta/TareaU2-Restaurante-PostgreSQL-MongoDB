import * as service from "../services/auth.service.js";

export const register = async (req, res) => res.status(201).json(await service.register(req.body));
export const login = async (req, res) => res.status(200).json(await service.login(req.body));
export const removeMe = async (req, res) => {
  await service.removeMe(req.user.id);
  res.status(200).json({ message: "Usuario eliminado" });
};
