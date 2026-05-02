import { Router } from "express";
import { auth } from "../middlewares/auth.middleware";
import { 
  listUsers, 
  createUser, 
  updateUser, 
  toggleBlockUser,
  getProfile, 
  updateProfile, 
  listSecurityLogs, 
  listFailedAttempts,
  listAuditTrail
} from "../controllers/users.controller";

const router = Router();

// Gestión de usuarios (Admin)
router.get("/", auth("admin"), listUsers);
router.post("/", auth("admin"), createUser);
router.patch("/:id", auth("admin"), updateUser);
router.post("/:id/toggle-block", auth("admin"), toggleBlockUser);


// Auditoría (Admin)
router.get("/security-logs", auth("admin"), listSecurityLogs);
router.get("/failed-attempts", auth("admin"), listFailedAttempts);
router.get("/audit-trail", auth("admin"), listAuditTrail);

// Perfil (Cualquier usuario autenticado)
router.get("/:id/profile", auth(), getProfile);
router.patch("/:id/profile", auth(), updateProfile);

export default router;