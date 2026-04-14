import { Router } from "express";
import { register, login, me, requestVerificationCode } from "../controllers/auth.controller";
import { auth } from "../middlewares/auth.middleware";
import { requiresCaptcha } from '../services/security.service'

const router = Router();

router.post("/send-verification-code", requestVerificationCode);
router.post("/register", register);
router.post("/login", login);
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