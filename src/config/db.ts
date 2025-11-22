// import mysql from "mysql2/promise";
// import dotenv from "dotenv";
// dotenv.config();

// export const pool = mysql.createPool({
//   host: process.env.DB_HOST || "localhost",
//   user: process.env.DB_USER || "root",
//   password: process.env.DB_PASS || "12345",
//   database: process.env.DB_NAME || "ecommerce_db",
//   waitForConnections: true,
//   connectionLimit: 10,
// });
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const dbUrl = process.env.DB_URL;

if (!dbUrl) {
  throw new Error("DB_URL is not defined in .env");
}

export const pool = mysql.createPool(dbUrl);
