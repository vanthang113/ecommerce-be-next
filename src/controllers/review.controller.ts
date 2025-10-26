import { Request, Response } from "express";
import { pool } from "../config/db";
import { AuthRequest } from "../middlewares/auth.middleware";

export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { product_id, rating, comment } = req.body as { product_id: number; rating: number; comment?: string };

    if (!product_id || !rating) {
      return res.status(400).json({ message: "product_id và rating là bắt buộc" });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "rating phải từ 1 đến 5" });
    }

    // Chỉ cho phép đánh giá khi người dùng đã mua sản phẩm và đơn đã hoàn thành
    const [orders]: any = await pool.query(
      `SELECT oi.id FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.user_id = ? AND oi.product_id = ? AND LOWER(o.status) = 'completed' LIMIT 1`,
      [userId, product_id]
    );
    if (!orders?.length) {
      return res.status(400).json({ message: "Bạn chỉ có thể đánh giá sau khi đã nhận hàng" });
    }

    // Nếu đã có review trước đó thì cập nhật, không thì tạo mới
    const [existing]: any = await pool.query(
      "SELECT id FROM reviews WHERE product_id = ? AND user_id = ? LIMIT 1",
      [product_id, userId]
    );

    if (existing?.length) {
      await pool.query("UPDATE reviews SET rating = ?, comment = ?, updated_at = NOW() WHERE id = ?", [rating, comment || null, existing[0].id]);
      return res.json({ message: "Review updated" });
    }

    await pool.query(
      "INSERT INTO reviews (product_id,user_id,rating,comment,created_at) VALUES (?,?,?,?,NOW())",
      [product_id, userId, rating, comment || null]
    );
    res.json({ message: "Review created" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const listReviewsAdmin = async (_req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query(
      `SELECT r.*, p.name as product_name, u.name as user_name
       FROM reviews r
       JOIN products p ON p.id = r.product_id
       JOIN users u ON u.id = r.user_id
       ORDER BY r.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getReviewsByProduct = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const [rows]: any = await pool.query(
      `SELECT r.*, u.name as user_name
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC`,
      [productId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteReviewAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM reviews WHERE id = ?", [id]);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
