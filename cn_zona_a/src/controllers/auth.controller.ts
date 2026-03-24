import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import type { StringValue } from "ms";
import { pool } from "../lib/db";

export async function register(req: Request, res: Response) {
  const { username, email, password, role } = req.body;

  const hash = await bcrypt.hash(password, 10);

  const result = await pool.request()
    .input("username", username)
    .input("email", email)
    .input("password", hash)
    .input("role", role || "student")
    .query(`
      INSERT INTO users (username, email, password_hash, role)
      OUTPUT INSERTED.id
      VALUES (@username, @email, @password, @role)
    `);

  const userId = result.recordset[0].id;

  await pool.request()
    .input("user_id", userId)
    .query(`INSERT INTO user_profiles(user_id) VALUES(@user_id)`);

  res.status(201).json({ message: "Usuario creado correctamente" });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  const result = await pool.request()
    .input("email", email)
    .query(`SELECT * FROM users WHERE email = @email`);

  const user = result.recordset[0];

  if (!user) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  const secret = process.env.JWT_SECRET as string;
  const expires = process.env.JWT_EXPIRES_IN as StringValue || "7d";

  const options: SignOptions = { expiresIn: expires };

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    secret,
    options
  );

  res.json({
    token,
    user: {
      userId: user.id,
      email:  user.email,
      role:   user.role,
    }
  });
}

export async function me(req: Request, res: Response) {
  const userId = (req as any).user.userId;

  const result = await pool.request()
    .input("id", userId)
    .query(`SELECT id, username, email, role FROM users WHERE id = @id`);

  res.json(result.recordset[0]);
}