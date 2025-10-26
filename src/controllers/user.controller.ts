import { Request, Response } from "express";
import { pool } from "../config/db";

export const getUsers = async (req: Request, res: Response) => {
  const [rows]: any = await pool.query("SELECT id,name,email,role,created_at,active FROM users ORDER BY created_at DESC");
  res.json(rows);
};

export const getProfile = async (req: any, res: Response) => {
  const user = req.user;
  const [rows]: any = await pool.query("SELECT id,name,email,role,created_at,active FROM users WHERE id = ?", [user.id]);
  res.json(rows[0]);
};

export const updateProfile = async (req: any, res: Response) => {
  const user = req.user;
  const payload = req.body;
  await pool.query("UPDATE users SET ? WHERE id = ?", [payload, user.id]);
  res.json({ message: "Updated" });
};

export const toggleUserActive = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { active } = req.body;
  await pool.query("UPDATE users SET active = ? WHERE id = ?", [active, id]);
  res.json({ message: "Updated" });
};

// Admin: create user
export const createUser = async (req: Request, res: Response) => {
  const { name, email, password = "123456", role = "user" } = req.body || {};
  try {
    const [exists]: any = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (exists.length) return res.status(400).json({ message: "Email already used" });
    const [result]: any = await pool.query(
      "INSERT INTO users (name,email,password,role,active,created_at) VALUES (?,?,?,?,1,NOW())",
      [name, email, password, role]
    );
    res.status(201).json({ id: result.insertId, name, email, role, active: 1 });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: update user by id
export const updateUserByAdmin = async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = req.body || {};
  try {
    await pool.query("UPDATE users SET ? WHERE id = ?", [payload, id]);
    const [rows]: any = await pool.query("SELECT id,name,email,role,active,created_at FROM users WHERE id = ?", [id]);
    res.json(rows[0] || { id, ...payload });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: delete user
export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM users WHERE id = ?", [id]);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};