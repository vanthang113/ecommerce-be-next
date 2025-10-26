import { Router } from "express";
import { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory } from "../controllers/category.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/role.middleware";

const router = Router();

// Public
router.get("/", getCategories);
router.get("/:id", getCategoryById);

// Admin
router.post("/", authMiddleware, requireAdmin, createCategory);
router.put("/:id", authMiddleware, requireAdmin, updateCategory);
router.delete("/:id", authMiddleware, requireAdmin, deleteCategory);

export default router;
