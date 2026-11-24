import * as service from "../services/review.service.js";

export const create = async (req, res) =>
  res.status(201).json(await service.createReview(req.user.id, req.body));
export const list = async (req, res) => res.status(200).json(await service.listReviews(req.query));
