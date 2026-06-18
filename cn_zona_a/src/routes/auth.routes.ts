import { Router } from "express";
import { register, login, me, requestVerificationCode, forgotPassword, resetPassword } from "../controllers/auth.controller";
import { auth } from "../middlewares/auth.middleware";
import { requiresCaptcha } from '../services/security.service'

import { validate } from "../middlewares/validate.middleware";
import { registerSchema, loginSchema, verificationCodeSchema, forgotPasswordSchema, resetPasswordSchema } from "../schemas/auth.schemas";

const router = Router();

// Rutas "Nivel Pro" (Limpias)
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/verify", validate(verificationCodeSchema), requestVerificationCode);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

// Alias por retrocompatibilidad con el frontend actual
router.post("/send-verification-code", validate(verificationCodeSchema), requestVerificationCode);

router.get("/me", auth(), me);


// Agregar esta ruta nueva:
// GET /api/auth/captcha-required?email=xxx
// El hook useCaptchaRequired del frontend ya está listo para consumirla
router.get('/captcha-required', async (req, res) => {
  const email = req.query.email as string
  if (!email) return res.json({ required: false })
  const required = await requiresCaptcha(email)
  res.json({ required })
})


export default router;  