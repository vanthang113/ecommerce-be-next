import { Request, Response } from "express";
import { pool } from "../config/db";

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { q, category, minPrice, maxPrice, brand, page = 1, limit = 12 } = req.query;
    let where = "WHERE 1=1";
    const params: any[] = [];
    if (q) { where += " AND name LIKE ?"; params.push(`%${q}%`); }
    if (category) { where += " AND category_id = ?"; params.push(category); }
    if (brand) { where += " AND brand = ?"; params.push(brand); }
    if (minPrice) { where += " AND price >= ?"; params.push(minPrice); }
    if (maxPrice) { where += " AND price <= ?"; params.push(maxPrice); }

    const offset = (Number(page) - 1) * Number(limit);
    const [rows]: any = await pool.query(`SELECT * FROM products ${where} LIMIT ? OFFSET ?`, [...params, Number(limit), offset]);
    
      // Parse images from MySQL JSON type
    const products = rows.map((product: any) => {
      let images = [];
      if (product.images) {
        try {
          // MySQL JSON type returns objects, but sometimes as strings
          if (typeof product.images === 'string') {
            images = JSON.parse(product.images);
          } else if (Array.isArray(product.images)) {
            images = product.images;
          }
        } catch (e) {
          console.error('Error parsing images for product', product.id, ':', e);
          images = [];
        }
      }
      return {
        ...product,
        images
      };
    });
    
    res.json(products);
  } catch (err: any) {
    console.error('Error in getProducts:', err);
    res.status(500).json({ message: "Server error", error: err?.message || 'Unknown error' });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [rows]: any = await pool.query("SELECT * FROM products WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ message: "Not found" });
    const product = rows[0];
    
    // Parse images from MySQL JSON type
    let images = [];
    if (product.images) {
      try {
        if (typeof product.images === 'string') {
          images = JSON.parse(product.images);
        } else if (Array.isArray(product.images)) {
          images = product.images;
        }
      } catch (e) {
        console.error('Error parsing images for product', product.id, ':', e);
        images = [];
      }
    }
    product.images = images;
    
    // fetch reviews
    const [reviews]: any = await pool.query("SELECT r.*, u.name as user_name FROM reviews r JOIN users u ON r.user_id = u.id WHERE product_id = ?", [id]);
    res.json({ ...product, reviews });
  } catch (err: any) {
    console.error('Error in getProductById:', err);
    res.status(500).json({ message: "Server error", error: err?.message || 'Unknown error' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, stock, category_id, brand, images } = req.body;
    
    // Validate and format images data for MySQL JSON type
    let imagesData = [];
    if (images) {
      if (Array.isArray(images)) {
        imagesData = images.filter(img => img && typeof img === 'string' && img.trim() !== '');
      } else if (typeof images === 'string') {
        // Split by comma and clean up
        imagesData = images.split(',').map(img => img.trim()).filter(img => img !== '');
      }
    }
    
    console.log('Creating product with images:', imagesData);
    
    const [result]: any = await pool.query(
      "INSERT INTO products (name,description,price,stock,category_id,brand,images,created_at) VALUES (?,?,?,?,?,?,?,NOW())",
      [name, description, price, stock, category_id, brand, JSON.stringify(imagesData)]
    );
    res.json({ id: result.insertId, message: "Created" });
  } catch (err: any) {
    console.error('Error in createProduct:', err);
    res.status(500).json({ message: "Server error", error: err?.message || 'Unknown error' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    
    // Handle images data properly for MySQL JSON type
    if (payload.images) {
      let imagesData = [];
      if (Array.isArray(payload.images)) {
        imagesData = payload.images.filter((img: string) => img && typeof img === 'string' && img.trim() !== '');
      } else if (typeof payload.images === 'string') {
        imagesData = payload.images.split(',').map((img: string) => img.trim()).filter((img: string) => img !== '');
      }
      payload.images = JSON.stringify(imagesData);
    }
    
    console.log('Updating product with images:', payload.images);
    
    await pool.query("UPDATE products SET ? WHERE id = ?", [payload, id]);
    res.json({ message: "Updated" });
  } catch (err: any) {
    console.error('Error in updateProduct:', err);
    res.status(500).json({ message: "Server error", error: err?.message || 'Unknown error' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM products WHERE id = ?", [id]);
    res.json({ message: "Deleted" });
  } catch (err: any) {
    console.error('Error in deleteProduct:', err);
    res.status(500).json({ message: "Server error", error: err?.message || 'Unknown error' });
  }
};
