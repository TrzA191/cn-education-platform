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
