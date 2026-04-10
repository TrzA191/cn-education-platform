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


export async function listSecurityLogs(req: Request, res: Response) {
  try {
    const result = await pool.request().query(`
      SELECT TOP 100
        sl.id, sl.user_id, u.email, sl.event_type,
        sl.description, sl.ip_address, sl.severity,
        sl.status, sl.created_at
      FROM security_logs sl
      LEFT JOIN users u ON sl.user_id = u.id
      ORDER BY sl.created_at DESC
    `)
    res.json(result.recordset)
  } catch (err) {
    console.error('[listSecurityLogs]', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export async function listFailedAttempts(req: Request, res: Response) {
  try {
    const result = await pool.request().query(`
      SELECT TOP 50
        id, email, ip_address, user_agent, attempted_at
      FROM failed_login_attempts
      ORDER BY attempted_at DESC
    `)
    res.json(result.recordset)
  } catch (err) {
    console.error('[listFailedAttempts]', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
