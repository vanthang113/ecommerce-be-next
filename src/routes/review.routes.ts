import { Router } from "express";
import { createReview, listReviewsAdmin, deleteReviewAdmin, getReviewsByProduct } from "../controllers/review.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/role.middleware";

const router = Router();
router.post("/", authMiddleware, createReview);
router.get("/", authMiddleware, requireAdmin, listReviewsAdmin);
router.get("/product/:productId", getReviewsByProduct);
router.delete("/:id", authMiddleware, requireAdmin, deleteReviewAdmin);

export default router;
