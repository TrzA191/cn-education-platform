import { Request, Response } from "express";
import { pool } from "../lib/db";

export async function listUsers(req: Request, res: Response) {

  const result = await pool.request().query(`
SELECT id,username,email,role,created_at
FROM users
`);

  res.json(result.recordset);

}

export async function getProfile(req: Request, res: Response) {

  const { id } = req.params;

  const result = await pool.request()
    .input("id", id)
    .query(`
SELECT *
FROM user_profiles
WHERE user_id=@id
`);

  res.json(result.recordset[0]);

}

export async function updateProfile(req: Request, res: Response) {

  const { id } = req.params;
  const { avatar_url, bio, country, timezone, language } = req.body;

  await pool.request()
    .input("id", id)
    .input("avatar_url", avatar_url)
    .input("bio", bio)
    .input("country", country)
    .input("timezone", timezone)
    .input("language", language)
    .query(`
UPDATE user_profiles
SET avatar_url=@avatar_url,
bio=@bio,
country=@country,
timezone=@timezone,
language=@language
WHERE user_id=@id
`);

  res.json({ message: "Profile updated" });

}