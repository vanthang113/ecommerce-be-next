import { Request, Response } from "express";
import { pool } from "../config/db";
import { hashPassword, comparePassword } from "../utils/password";
import { signToken } from "../utils/token";
import { sendMail } from "../utils/mail";
import crypto from "crypto";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const [rows]: any = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (rows.length) return res.status(400).json({ message: "Email already used" });

    const hashed = await hashPassword(password);
    const [result]: any = await pool.query(
      "INSERT INTO users (name,email,password,role,created_at) VALUES (?,?,?,?,NOW())",
      [name, email, hashed, "user"]
    );
    const userId = result.insertId;
    const token = signToken({ id: userId, email, role: "user" });
    res.json({ token, user: { id: userId, name, email, role: "user" } });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const [rows]: any = await pool.query("SELECT id,name,email,password,role FROM users WHERE email = ?", [email]);
    if (!rows.length) return res.status(400).json({ message: "Invalid credentials" });
    const user = rows[0];
    const ok = await comparePassword(password, user.password);
    if (!ok) return res.status(400).json({ message: "Invalid credentials" });
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    delete user.password;
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const [rows]: any = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (!rows.length) return res.status(400).json({ message: "Email not found" });
    const token = crypto.randomBytes(32).toString("hex");
    // store token in table password_resets
    await pool.query(
      "INSERT INTO password_resets (user_email,token,created_at) VALUES (?,?,NOW())",
      [email, token]
    );
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    await sendMail(email, "Reset password", `<p>Click link: <a href="${resetLink}">${resetLink}</a></p>`);
    res.json({ message: "Reset link sent" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, token, newPassword } = req.body;
    const [rows]: any = await pool.query("SELECT id,created_at FROM password_resets WHERE user_email = ? AND token = ?", [email, token]);
    if (!rows.length) return res.status(400).json({ message: "Invalid token" });
    // optionally check expiry (e.g., 1 hour)
    const hashed = await hashPassword(newPassword);
    await pool.query("UPDATE users SET password = ? WHERE email = ?", [hashed, email]);
    // delete token
    await pool.query("DELETE FROM password_resets WHERE user_email = ?", [email]);
    res.json({ message: "Password updated" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
