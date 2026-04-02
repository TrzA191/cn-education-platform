import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import type { StringValue } from "ms";
import { pool } from "../lib/db";

export async function register(req: Request, res: Response) {

  const { username, email, password } = req.body;

  // Verifica que no exista antes de insertar
  const existing = await pool.request()
    .input("email", email)
    .input("username", username)
    .query(`SELECT id FROM users WHERE email = @email OR username = @username`)

  if (existing.recordset.length > 0) {
    return res.status(409).json({ error: 'El email o username ya está en uso' })
  }

  const hash = await bcrypt.hash(password, 10);

  const result = await pool.request()
    .input("username", username)
    .input("email", email)
    .input("password", hash)
    .query(`
<<<<<<< Updated upstream
INSERT INTO users (username,email,password_hash)
OUTPUT INSERTED.id
VALUES (@username,@email,@password)
`);
=======
      INSERT INTO users (username, email, password_hash, role, created_at)
      OUTPUT INSERTED.id
      VALUES (@username, @email, @password, @role, GETDATE())
    `);
>>>>>>> Stashed changes

  const userId = result.recordset[0].id;

  await pool.request()
    .input("user_id", userId)
<<<<<<< Updated upstream
    .query(`
INSERT INTO user_profiles(user_id)
VALUES(@user_id)
`);

  res.json({ message: "User created" });

=======
    .query(`INSERT INTO user_profiles (user_id, language) VALUES (@user_id, 'es')`);

  res.status(201).json({ message: "Usuario creado correctamente" })
>>>>>>> Stashed changes
}
export async function login(req: Request, res: Response) {

  const { email, password } = req.body;

  const result = await pool.request()
    .input("email", email)
    .query(`
SELECT * FROM users WHERE email=@email
`);

  const user = result.recordset[0];

<<<<<<< Updated upstream
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
=======
  if (!user) return res.status(401).json({ error: "Credenciales inválidas" });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: "Credenciales inválidas" });

  const secret  = process.env.JWT_SECRET as string;
  const expires = process.env.JWT_EXPIRES_IN as StringValue || "7d";

  const token = jwt.sign(
    { sub: user.id, username: user.username, role: user.role }, // ← sub en lugar de userId
>>>>>>> Stashed changes
    secret,
    { expiresIn: expires }
  );

  res.json({
    token,
    user: {
<<<<<<< Updated upstream
      userId: user.id,
      email: user.email,
      role: user.role,
    }
  });

=======
      id:       user.id,        // ← id en lugar de userId
      username: user.username,  // ← agrega username
      email:    user.email,
      role:     user.role,
    }
  })
>>>>>>> Stashed changes
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