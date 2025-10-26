import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/role.middleware";
import {
  getUsers,
  getProfile,
  updateProfile,
  toggleUserActive,
  createUser,
  updateUserByAdmin,
  deleteUser,
} from "../controllers/user.controller";

const router = Router();

// Profile of current authenticated user
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);

// Admin: users management
router.get("/", authMiddleware, requireAdmin, getUsers);
router.post("/", authMiddleware, requireAdmin, createUser);
router.put("/:id", authMiddleware, requireAdmin, updateUserByAdmin);
router.delete("/:id", authMiddleware, requireAdmin, deleteUser);
router.put("/:id/active", authMiddleware, requireAdmin, toggleUserActive);

export default router;
