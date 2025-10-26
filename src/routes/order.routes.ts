import { Request, Response, Router } from "express";
import { pool } from "../config/db";
import { AuthRequest } from "../middlewares/auth.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/role.middleware";

const router = Router();

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { items, shipping_address, payment_method } = req.body;
    // items = [{ product_id, qty, price }]
    // create order
    const [orderRes]: any = await pool.query(
      "INSERT INTO orders (user_id,shipping_address,payment_method,status,total_amount,created_at) VALUES (?,?,?,?,?,NOW())",
      [
        userId,
        JSON.stringify(shipping_address),
        payment_method,
        "pending",
        items.reduce((s: number, it: any) => s + it.price * it.qty, 0),
      ]
    );
    const orderId = orderRes.insertId;
    // insert order_items
    for (const it of items) {
      await pool.query(
        "INSERT INTO order_items (order_id,product_id,qty,price) VALUES (?,?,?,?)",
        [orderId, it.product_id, it.qty, it.price]
      );
      // giảm stock
      await pool.query("UPDATE products SET stock = stock - ? WHERE id = ?", [it.qty, it.product_id]);
    }
    res.json({ orderId, message: "Order created" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const getOrdersForUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const [orders]: any = await pool.query(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );

    // Fetch items for each order with product info
    for (const order of orders) {
      const [items]: any = await pool.query(
        `SELECT oi.id, oi.order_id, oi.product_id, oi.qty, oi.price,
                p.name as product_name, p.images as product_images
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = ?`,
        [order.id]
      );

      order.items = items;
    }

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query("SELECT o.*, u.name as user_name FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await pool.query("UPDATE orders SET status = ? WHERE id = ?", [status, id]);
    res.json({ message: "Updated" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// GET /orders/stats?range=day|week|month
export const getOrderStats = async (req: Request, res: Response) => {
  try {
    const range = String(req.query.range || "day");

    let dateFormat = "%Y-%m-%d"; // default by day
    let intervalWhere = "DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)"; // last 7 days
    if (range === "week") {
      dateFormat = "%x-%v"; // ISO year-week
      intervalWhere = "YEARWEEK(created_at, 3) >= YEARWEEK(DATE_SUB(CURDATE(), INTERVAL 12 WEEK), 3)"; // last 12 weeks
    } else if (range === "month") {
      dateFormat = "%Y-%m";
      intervalWhere = "DATE_FORMAT(created_at, '%Y-%m') >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 12 MONTH), '%Y-%m')"; // last 12 months
    }

    const [rows]: any = await pool.query(
      `SELECT DATE_FORMAT(created_at, ?) as label,
              COUNT(*) as order_count,
              SUM(total_amount) as total_amount
       FROM orders
       WHERE ${intervalWhere}
       GROUP BY label
       ORDER BY MIN(created_at) ASC`
      , [dateFormat]
    );

    res.json(rows || []);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const cancelMyOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const [rows]: any = await pool.query("SELECT id, user_id, status FROM orders WHERE id = ?", [id]);
    const order = rows?.[0];
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.user_id !== userId) return res.status(403).json({ message: "Forbidden" });
    const current = String(order.status || '').toLowerCase();
    if (current !== "pending") {
      return res.status(400).json({ message: "Chỉ có thể hủy đơn khi đang chờ xác nhận" });
    }
    await pool.query("UPDATE orders SET status = 'cancelled' WHERE id = ?", [id]);
    res.json({ message: "Cancelled" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteOrderAsAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [rows]: any = await pool.query("SELECT status FROM orders WHERE id = ?", [id]);
    const order = rows?.[0];
    if (!order) return res.status(404).json({ message: "Order not found" });
    const current = String(order.status || '').toLowerCase();
    if (current !== "cancelled") {
      return res.status(400).json({ message: "Chỉ xóa được đơn đã hủy" });
    }
    await pool.query("DELETE FROM order_items WHERE order_id = ?", [id]);
    await pool.query("DELETE FROM orders WHERE id = ?", [id]);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Define routes
router.post("/", authMiddleware, createOrder);
router.get("/my", authMiddleware, getOrdersForUser);
router.get("/", authMiddleware, requireAdmin, getAllOrders);
router.get("/stats", authMiddleware, requireAdmin, getOrderStats);
router.put("/:id/status", authMiddleware, requireAdmin, updateOrderStatus);
router.put("/:id/cancel", authMiddleware, cancelMyOrder);
router.delete("/:id", authMiddleware, requireAdmin, deleteOrderAsAdmin);

export default router;