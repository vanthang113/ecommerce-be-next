import { Request, Response } from "express";
import { pool } from "../config/db";

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}+/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// Lấy tất cả categories
export const getCategories = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query("SELECT * FROM categories ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// Lấy category theo ID
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query("SELECT * FROM categories WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Category not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// Tạo mới category
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    let { slug } = req.body as { slug?: string };
    if (!name) return res.status(400).json({ message: "Name is required" });

    const finalSlug = slug && slug.trim() ? slugify(slug) : slugify(name);

    await pool.query("INSERT INTO categories (name, slug, created_at) VALUES (?, ?, NOW())", [name, finalSlug]);
    res.json({ message: "Category created" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// Cập nhật category
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    let { slug } = req.body as { slug?: string };
    const finalSlug = slug && slug.trim() ? slugify(slug) : name ? slugify(name) : undefined;

    if (finalSlug !== undefined) {
      await pool.query("UPDATE categories SET name=?, slug=? WHERE id=?", [name, finalSlug, req.params.id]);
    } else {
      await pool.query("UPDATE categories SET name=? WHERE id=?", [name, req.params.id]);
    }
    res.json({ message: "Category updated" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// Xoá category
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    await pool.query("DELETE FROM categories WHERE id=?", [req.params.id]);
    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};
