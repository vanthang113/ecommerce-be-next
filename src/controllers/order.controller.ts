import { Request, Response } from "express";
import { pool } from "../config/db";
import { AuthRequest } from "../middlewares/auth.middleware";

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { items, shipping, paymentMethod } = req.body;
    // items = [{ product_id, qty, price }]
    // create order
    const [orderRes]: any = await pool.query(
      "INSERT INTO orders (user_id,shipping_address,payment_method,status,total_amount,created_at) VALUES (?,?,?,?,?,NOW())",
      [
        userId,
        JSON.stringify(shipping),
        paymentMethod,
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
    const [rows]: any = await pool.query("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC", [userId]);
    res.json(rows);
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
