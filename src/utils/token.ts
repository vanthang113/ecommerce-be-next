import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";

// If JWT_SECRET is not provided, generate a random one on each server start.
// This intentionally invalidates previous tokens after a restart, forcing re-login.
const SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");

export const signToken = (payload: object): string => {
  const options: SignOptions = { expiresIn: "1h" };
  return jwt.sign(payload, SECRET, options);
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, SECRET);
};


// import jwt, { SignOptions } from "jsonwebtoken";

// export const signToken = (payload: object): string => {
//   const options: SignOptions = { expiresIn: "1h" };
//   return jwt.sign(payload, process.env.JWT_SECRET as string, options);
// };

// export const verifyToken = (token: string) => {
//   return jwt.verify(token, process.env.JWT_SECRET as string);
// };
