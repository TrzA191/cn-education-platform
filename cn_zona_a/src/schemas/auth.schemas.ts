import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres').max(50, 'El nombre de usuario no puede exceder los 50 caracteres'),
    email: z.string().email('Debe ser un correo electrónico válido (ej: usuario@dominio.com)'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(100, 'La contraseña es demasiado larga'),
    role: z.enum(['student', 'teacher']).optional().default('student'),
    verificationCode: z.string().length(6, 'El código de verificación debe tener exactamente 6 dígitos'),
  }),
});

export const verificationCodeSchema = z.object({
  body: z.object({
    email: z.string().email('Debe ser un correo electrónico válido'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Debe ser un correo electrónico válido'),
    password: z.string().min(1, 'La contraseña no puede estar vacía'),
    captchaToken: z.string().optional(),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Debe ser un correo electrónico válido'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Debe ser un correo electrónico válido'),
    code: z.string().length(6, 'El código debe tener exactamente 6 dígitos'),
    newPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(100, 'La contraseña es demasiado larga'),
  }),
});
