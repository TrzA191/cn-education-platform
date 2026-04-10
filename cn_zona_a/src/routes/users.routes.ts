import { Router } from "express";
import { auth } from "../middlewares/auth.middleware";
import { listUsers, getProfile, updateProfile, listSecurityLogs, listFailedAttempts } from "../controllers/users.controller";


const router = Router();

router.get("/", auth("admin"), listUsers);

router.get("/:id/profile", auth(), getProfile);

router.patch("/:id/profile", auth(), updateProfile);

router.get("/", auth("admin"), listUsers);
router.get("/security-logs", auth("admin"), listSecurityLogs)
router.get("/failed-attempts", auth("admin"), listFailedAttempts)
router.get("/:id/profile", auth(), getProfile);
router.patch("/:id/profile", auth(), updateProfile);

export default router;