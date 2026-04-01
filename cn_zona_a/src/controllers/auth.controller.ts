import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import type { StringValue } from "ms";
import { pool } from "../lib/db";

export async function register(req: Request, res: Response) {

  const { username, email, password } = req.body;

  const hash = await bcrypt.hash(password, 10);

  const result = await pool.request()
    .input("username", username)
    .input("email", email)
    .input("password", hash)
    .query(`
INSERT INTO users (username,email,password_hash)
OUTPUT INSERTED.id
VALUES (@username,@email,@password)
`);

  const userId = result.recordset[0].id;

  await pool.request()
    .input("user_id", userId)
    .query(`
INSERT INTO user_profiles(user_id)
VALUES(@user_id)
`);

  res.json({ message: "User created" });

}

export async function login(req: Request, res: Response) {

  const { email, password } = req.body;

  const result = await pool.request()
    .input("email", email)
    .query(`
SELECT * FROM users WHERE email=@email
`);

  const user = result.recordset[0];

  if (!user) {
    return res.status(400).json({ error: "Usuario no encontrado" });
  }

  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    return res.status(401).json({ error: "Contraseña incorrecta" });
  }

  const secret = process.env.JWT_SECRET as string;
  const expires = process.env.JWT_EXPIRES as StringValue;

  const options: SignOptions = {
    expiresIn: expires
  };

  const token = jwt.sign(
    { id: user.id, role: user.role },
    secret,
    options
  );

  res.json({
    token,
    user: {
      userId: user.id,
      email: user.email,
      role: user.role,
    }
  });

}

export async function me(req: Request, res: Response) {

  const userId = (req as any).user.id;

  const result = await pool.request()
    .input("id", userId)
    .query(`
SELECT id,username,email,role
FROM users WHERE id=@id
`);

  res.json(result.recordset[0]);

}