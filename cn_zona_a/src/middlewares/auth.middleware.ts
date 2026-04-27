import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { pool } from "../lib/db";
import { logSecurityEvent } from "../services/security.service";
import { JwtPayload } from "../types/auth.types";

export function auth(requiredRole?: string) {

  return async (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ message: "No token" });

    const token = header.split(" ")[1];
    const ipAddress = req.ip ?? 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    try {
      // 1. Verificar firma del JWT
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as JwtPayload;

      // 2. Verificar estado de la sesión en la Base de Datos
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      
      const sessionResult = await pool.request()
        .input('token_hash', tokenHash)
        .query(`
          SELECT is_revoked, ip_address 
          FROM active_sessions 
          WHERE token_hash = @token_hash AND expires_at > GETUTCDATE()
        `);

      const session = sessionResult.recordset[0];

      // Si no existe la sesión o está revocada
      if (!session || session.is_revoked) {
        return res.status(401).json({ message: "Sesión expirada o revocada" });
      }

      // 3. DETECCIÓN SOSPECHOSA: ¿Cambió la IP durante la sesión?
      if (session.ip_address !== ipAddress) {
        // Marcamos la sesión como revocada inmediatamente
        await pool.request()
          .input('token_hash', tokenHash)
          .query(`UPDATE active_sessions SET is_revoked = 1 WHERE token_hash = @token_hash`);

        await logSecurityEvent({
          userId: decoded.id,
          eventType: 'suspicious_access',
          description: `Sesión revocada automáticamente: Cambio de IP detectado (Origen: ${session.ip_address} -> Actual: ${ipAddress})`,
          ipAddress,
          userAgent,
          severity: 'alto'
        });

        return res.status(401).json({ message: "Actividad sospechosa detectada. Por favor, inicia sesión de nuevo." });
      }

      (req as any).user = decoded;

      if (requiredRole && decoded.role !== requiredRole)
        return res.status(403).json({ message: "Forbidden" });

      next();

    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };

}