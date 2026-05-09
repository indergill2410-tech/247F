import crypto from "crypto";
import jwt from "jsonwebtoken";

const _jwtSecret = process.env["SESSION_SECRET"];
if (!_jwtSecret) {
  throw new Error("SESSION_SECRET environment variable is required");
}
const JWT_SECRET: string = _jwtSecret;
const TOKEN_EXPIRY = "7d";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const inputHash = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(inputHash, "hex"));
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}
