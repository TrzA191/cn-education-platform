import { Request, Response } from "express";
import { pool } from "../lib/db";
import bcrypt from "bcryptjs";
import { logSecurityEvent, logAudit } from "../services/security.service";
import { 
  sendTeacherApprovalNotification, 
  sendAccountBlockNotification, 
  sendAccountUnblockNotification 
} from '../lib/email';


export async function listUsers(req: Request, res: Response) {
  try {
    const result = await pool.request().query(`
      SELECT id, username, email, role, created_at, is_blocked
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
  const { username, email, password, role, verificationCode } = req.body;
  const adminId = (req as any).user?.id;
  const ipAddress = req.ip ?? 'unknown';

  if (!username || !email || !password || !verificationCode) {
    return res.status(400).json({ error: "Faltan campos obligatorios (incluyendo código)" });
  }

  try {
    // 1. Verificar el código
    const verifyResult = await pool.request()
      .input('email', email)
      .input('code', verificationCode)
      .query(`
        SELECT * FROM verification_codes 
        WHERE email = @email AND code = @code AND expires_at > GETDATE()
      `);

    if (verifyResult.recordset.length === 0) {
      return res.status(400).json({ error: 'Código de verificación inválido o expirado' });
    }

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

    // Eliminar el código usado
    await pool.request()
      .input('email', email)
      .query(`DELETE FROM verification_codes WHERE email = @email`);

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
      eventType: 'login_success', 
      description: `Admin [${adminId}] creó y verificó usuario: ${email} (${role})`,
      ipAddress,
      severity: 'bajo'
    });

    res.status(201).json({ message: "Usuario creado y verificado", id: newUserId });
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

export async function toggleBlockUser(req: Request, res: Response) {
  const { id } = req.params;
  const adminId = (req as any).user?.id;
  const ipAddress = req.ip ?? 'unknown';

  if (Number(id) === adminId) {
    return res.status(400).json({ error: "No puedes bloquearte a ti mismo" });
  }

  try {
    // Obtener estado actual
    const userRes = await pool.request().input("id", id).query(`SELECT is_blocked, email, username FROM users WHERE id = @id`);
    if (userRes.recordset.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });

    
    const currentUser = userRes.recordset[0];
    const isCurrentlyBlocked = Boolean(currentUser.is_blocked);
    const newStatus = isCurrentlyBlocked ? 0 : 1;
    const userIdNum = Number(id);

    // 1. Actualizar tabla principal (Forzar 0 o 1)
    await pool.request()
      .input("id", userIdNum)
      .input("status", newStatus)
      .query(`UPDATE users SET is_blocked = @status WHERE id = @id`);

    // 2. Sincronización con blocked_accounts
    if (newStatus === 1) {
      // BLOQUEO: Insertar nuevo registro
      await pool.request()
        .input("user_id", userIdNum)
        .input("reason", "manual")
        .query(`
          INSERT INTO blocked_accounts (user_id, reason, blocked_at, is_active)
          VALUES (@user_id, @reason, GETUTCDATE(), 1)
        `);

      // CERRAR SESIONES INMEDIATAMENTE
      await pool.request()
        .input("user_id", userIdNum)
        .query(`UPDATE active_sessions SET is_revoked = 1 WHERE user_id = @user_id AND is_revoked = 0`);

      // Enviar correo de bloqueo
      sendAccountBlockNotification(currentUser.email, currentUser.username).catch(e => console.error('[toggleBlockUser] Mail Error:', e));

    } else {
      // DESBLOQUEO: Desactivar absolutamente todo lo anterior
      await pool.request()
        .input("user_id", userIdNum)
        .query(`
          UPDATE blocked_accounts 
          SET is_active = 0, 
              blocked_until = GETUTCDATE() 
          WHERE user_id = @user_id 
            AND (is_active = 1 OR blocked_until > GETUTCDATE())
        `);

      // Enviar correo de desbloqueo
      sendAccountUnblockNotification(currentUser.email, currentUser.username).catch(e => console.error('[toggleBlockUser] Mail Error:', e));
    }




    await logAudit({
      userId: adminId,
      tableName: 'users',
      recordId: userIdNum,
      action: 'UPDATE',
      oldValues: { is_blocked: currentUser.is_blocked },
      newValues: { is_blocked: newStatus },
      ipAddress
    });

    await logSecurityEvent({
      userId: adminId,
      eventType: newStatus === 1 ? 'account_blocked' : 'login_success',
      description: `Admin [${adminId}] ${newStatus === 1 ? 'bloqueó' : 'desbloqueó'} usuario ID: ${id} (${currentUser.email})`,
      ipAddress,
      severity: newStatus === 1 ? 'medio' : 'bajo'
    });

    res.json({ 
      message: newStatus === 1 ? "Usuario bloqueado correctamente" : "Usuario desbloqueado correctamente",
      is_blocked: !!newStatus
    });
  } catch (err) {
    console.error('[toggleBlockUser] Critical Error:', err);
    res.status(500).json({ 
      error: "Error al procesar el bloqueo/desbloqueo",
      details: err instanceof Error ? err.message : String(err)
    });
  }
}

export async function approveTeacher(req: Request, res: Response) {
  const { id } = req.params;
  const adminId = (req as any).user?.id;
  const ipAddress = req.ip ?? 'unknown';

  try {
    const userRes = await pool.request().input("id", id).query(`SELECT id, role, email, username FROM users WHERE id = @id`);
    if (userRes.recordset.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });
    
    const user = userRes.recordset[0];
    if (user.role !== 'pending_teacher') {
      return res.status(400).json({ error: "El usuario no tiene una solicitud de docente pendiente" });
    }

    await pool.request()
      .input("id", id)
      .query(`UPDATE users SET role = 'teacher' WHERE id = @id`);

    // Enviar notificación por correo (en segundo plano)
    sendTeacherApprovalNotification(user.email, user.username).catch(err => {
      console.error('[approveTeacher] Error enviando correo:', err);
    });

    await logAudit({

      userId: adminId,
      tableName: 'users',
      recordId: Number(id),
      action: 'UPDATE',
      oldValues: { role: 'pending_teacher' },
      newValues: { role: 'teacher' },
      ipAddress
    });

    await logSecurityEvent({
      userId: adminId,
      eventType: 'login_success',
      description: `Admin [${adminId}] aprobó solicitud de docente para: ${user.email}`,
      ipAddress,
      severity: 'medio'
    });

    res.json({ message: "Docente aprobado correctamente" });
  } catch (err) {
    console.error('[approveTeacher]', err);
    res.status(500).json({ error: "Error al aprobar docente" });
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

export async function listAuditTrail(req: Request, res: Response) {
  try {
    const result = await pool.request().query(`
      SELECT TOP 100
        at.id, at.user_id, u.email, at.table_name,
        at.record_id, at.action, at.old_values,
        at.new_values, at.ip_address, at.created_at
      FROM audit_trail at
      LEFT JOIN users u ON at.user_id = u.id
      ORDER BY at.created_at DESC
    `)
    res.json(result.recordset)
  } catch (err) {
    console.error('[listAuditTrail]', err)
    res.status(500).json({ error: 'Error al obtener la bitácora de auditoría' })
  }
}
