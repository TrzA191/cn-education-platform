import nodemailer from 'nodemailer';

export async function sendVerificationCode(email: string, code: string) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"CN Education" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Código de Verificación - CN Education',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <h2 style="color: #333;">Código de Verificación</h2>
          <p>Hola,</p>
          <p>Tu código para completar el registro es el siguiente:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4F46E5;">
              ${code}
            </span>
          </div>
          <p>Este código expirará en 10 minutos.</p>
          <p>Si no solicitaste este código, puedes ignorar este correo.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, data: info };
  } catch (err) {
    console.error('[sendVerificationCode] Excepción con Nodemailer:', err);
    return { success: false, error: err };
  }
}

export async function sendPasswordResetCode(email: string, code: string) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"CN Education" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Recuperación de Contraseña - CN Education',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <h2 style="color: #333;">Recuperación de Contraseña</h2>
          <p>Hola,</p>
          <p>Hemos recibido una solicitud para restablecer tu contraseña. Usa el siguiente código de seguridad:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #E53E3E;">
              ${code}
            </span>
          </div>
          <p>Este código expirará en 10 minutos.</p>
          <p><strong>Si no solicitaste este cambio, ignora este correo. Tu cuenta está segura.</strong></p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, data: info };
  } catch (err) {
    console.error('[sendPasswordResetCode] Excepción con Nodemailer:', err);
    return { success: false, error: err };
  }
}

export async function sendTeacherApprovalNotification(email: string, username: string) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Pathly Admin" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🚀 ¡Tu cuenta de Docente ha sido aprobada! - Pathly',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 40px; border-radius: 20px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 48px;">🚀</div>
            <h1 style="color: #1e293b; margin-top: 10px;">¡Bienvenido a bordo!</h1>
          </div>
          <p style="font-size: 16px; color: #475569; line-height: 1.6;">Hola <strong>${username}</strong>,</p>
          <p style="font-size: 16px; color: #475569; line-height: 1.6;">
            Nos complace informarte que tu solicitud para ser docente en <strong>Pathly</strong> ha sido aprobada por nuestro equipo administrativo.
          </p>
          <div style="background-color: #f8fafc; padding: 25px; border-radius: 15px; margin: 30px 0; border: 1px solid #e2e8f0;">
            <h3 style="color: #4f46e5; margin-top: 0;">¿Qué puedes hacer ahora?</h3>
            <ul style="color: #64748b; font-size: 14px; padding-left: 20px;">
              <li style="margin-bottom: 10px;">Subir contenidos en formato de video (MP4, MOV, WEBM).</li>
              <li style="margin-bottom: 10px;">Gestionar tus propios contenidos y ver el progreso de los alumnos.</li>
              <li style="margin-bottom: 10px;">Contribuir a la comunidad educativa de Pathly.</li>
            </ul>
          </div>
          <p style="font-size: 16px; color: #475569; line-height: 1.6;">
            Ya puedes acceder a tu panel de docente. No es necesario volver a iniciar sesión, simplemente refresca tu dashboard.
          </p>
          <div style="text-align: center; margin-top: 40px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
               style="background-color: #4f46e5; color: white; padding: 15px 30px; text-decoration: none; font-weight: bold; border-radius: 12px; display: inline-block;">
              Ir a mi Panel de Docente
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 40px 0;">
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">
            Este es un correo automático, por favor no respondas a este mensaje.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, data: info };
  } catch (err) {
    console.error('[sendTeacherApprovalNotification] Error:', err);
    return { success: false, error: err };
  }
}

export async function sendAccountBlockNotification(email: string, username: string) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Pathly Seguridad" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '⚠️ Aviso de Seguridad: Tu cuenta ha sido bloqueada - Pathly',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #fee2e2; padding: 40px; border-radius: 20px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 48px;">🔒</div>
            <h1 style="color: #991b1b; margin-top: 10px;">Cuenta Bloqueada</h1>
          </div>
          <p style="font-size: 16px; color: #475569; line-height: 1.6;">Hola <strong>${username}</strong>,</p>
          <p style="font-size: 16px; color: #475569; line-height: 1.6;">
            Te informamos que tu cuenta ha sido bloqueada temporalmente por un administrador de la plataforma. Debido a esto, tus sesiones activas han sido cerradas y no podrás ingresar hasta nuevo aviso.
          </p>
          <div style="background-color: #fef2f2; padding: 25px; border-radius: 15px; margin: 30px 0; border: 1px solid #fee2e2;">
            <p style="color: #991b1b; font-size: 14px; margin: 0;">
              <strong>Razón:</strong> Revisión administrativa de seguridad o política de uso.
            </p>
          </div>
          <p style="font-size: 16px; color: #475569; line-height: 1.6;">
            Si crees que esto es un error, por favor contacta al soporte técnico de la institución.
          </p>
          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 40px 0;">
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">
            Este es un correo automático de seguridad, por favor no respondas a este mensaje.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, data: info };
  } catch (err) {
    console.error('[sendAccountBlockNotification] Error:', err);
    return { success: false, error: err };
  }
}

export async function sendAccountUnblockNotification(email: string, username: string) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Pathly Seguridad" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '✅ Tu cuenta ha sido desbloqueada - Pathly',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #dcfce7; padding: 40px; border-radius: 20px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 48px;">🔓</div>
            <h1 style="color: #166534; margin-top: 10px;">¡Acceso Restaurado!</h1>
          </div>
          <p style="font-size: 16px; color: #475569; line-height: 1.6;">Hola <strong>${username}</strong>,</p>
          <p style="font-size: 16px; color: #475569; line-height: 1.6;">
            Tu cuenta ha sido desbloqueada y el acceso a la plataforma ha sido restaurado completamente. Ya puedes iniciar sesión de forma normal.
          </p>
          <div style="text-align: center; margin-top: 40px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login" 
               style="background-color: #166534; color: white; padding: 15px 30px; text-decoration: none; font-weight: bold; border-radius: 12px; display: inline-block;">
              Iniciar Sesión Ahora
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 40px 0;">
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">
            Gracias por tu paciencia.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, data: info };
  } catch (err) {
    console.error('[sendAccountUnblockNotification] Error:', err);
    return { success: false, error: err };
  }
}


