import { Request, Response } from "express";
import { pool } from "../lib/db";
import bcrypt from "bcryptjs";
import { logSecurityEvent, logAudit } from "../services/security.service";

export async function listUsers(req: Request, res: Response) {
  try {
    const result = await pool.request().query(`
      SELECT id, username, email, role, created_at
      FROM users
      ORDER BY created_at DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('[listUsers]', err);
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
}

export async function createUser(req: Request, res: Response) {
  const { username, email, password, role } = req.body;
  const adminId = (req as any).user?.id;
  const ipAddress = req.ip ?? 'unknown';

  if (!username || !email || !password) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  try {
    const hash = await bcrypt.hash(password, 12);
    
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

    const newUserId = result.recordset[0].id;

    // Crear perfil vacío
    await pool.request()
      .input("user_id", newUserId)
      .query(`INSERT INTO user_profiles (user_id) VALUES (@user_id)`);

    await logAudit({
      userId: adminId,
      tableName: 'users',
      recordId: newUserId,
      action: 'INSERT',
      newValues: { username, email, role },
      ipAddress
    });

    await logSecurityEvent({
      userId: adminId,
      eventType: 'login_success', // Reutilizando tipo o podrías crear 'user_created'
      description: `Admin [${adminId}] creó usuario: ${email} (${role})`,
      ipAddress,
      severity: 'bajo'
    });

    res.status(201).json({ message: "Usuario creado", id: newUserId });
  } catch (err: any) {
    if (err.number === 2627 || err.number === 2601) {
      return res.status(409).json({ error: "El correo o usuario ya existe" });
    }
    console.error('[createUser]', err);
    res.status(500).json({ error: "Error al crear usuario" });
  }
}

export async function updateUser(req: Request, res: Response) {
  const { id } = req.params;
  const { username, email, role } = req.body;
  const adminId = (req as any).user?.id;
  const ipAddress = req.ip ?? 'unknown';

  try {
    // Obtener valores antiguos para auditoría
    const oldRes = await pool.request().input("id", id).query(`SELECT username, email, role FROM users WHERE id = @id`);
    const oldValues = oldRes.recordset[0];

    await pool.request()
      .input("id", id)
      .input("username", username)
      .input("email", email)
      .input("role", role)
      .query(`
        UPDATE users 
        SET username = @username, email = @email, role = @role 
        WHERE id = @id
      `);

    await logAudit({
      userId: adminId,
      tableName: 'users',
      recordId: Number(id),
      action: 'UPDATE',
      oldValues,
      newValues: { username, email, role },
      ipAddress
    });

    await logSecurityEvent({
      userId: adminId,
      eventType: 'password_changed', // Reutilizando para auditoría
      description: `Admin [${adminId}] actualizó usuario ID: ${id}`,
      ipAddress,
      severity: 'bajo'
    });

    res.json({ message: "Usuario actualizado" });
  } catch (err) {
    console.error('[updateUser]', err);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
}

export async function deleteUser(req: Request, res: Response) {
  const { id } = req.params;
  const adminId = (req as any).user?.id;
  const ipAddress = req.ip ?? 'unknown';

  if (Number(id) === adminId) {
    return res.status(400).json({ error: "No puedes eliminarte a ti mismo" });
  }

  try {
    // Obtener valores antiguos antes de borrar
    const oldRes = await pool.request().input("id", id).query(`SELECT username, email, role FROM users WHERE id = @id`);
    const oldValues = oldRes.recordset[0];

    // Primero perfiles y datos relacionados si hay cascada manual
    await pool.request().input("id", id).query(`DELETE FROM user_profiles WHERE user_id = @id`);
    // Luego el usuario
    await pool.request().input("id", id).query(`DELETE FROM users WHERE id = @id`);

    await logAudit({
      userId: adminId,
      tableName: 'users',
      recordId: Number(id),
      action: 'DELETE',
      oldValues,
      ipAddress
    });

    await logSecurityEvent({
      userId: adminId,
      eventType: 'session_revoked',
      description: `Admin [${adminId}] eliminó usuario ID: ${id}`,
      ipAddress,
      severity: 'medio'
    });

    res.json({ message: "Usuario eliminado correctamente" });
  } catch (err) {
    console.error('[deleteUser]', err);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
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
