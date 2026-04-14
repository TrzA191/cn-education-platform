import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.middleware'
import { proxy } from '../middlewares/proxy.middleware'

const router = Router()

const ZONA_A = process.env.ZONA_A_URL!
const ZONA_B = process.env.ZONA_B_URL!

// ── ZONA A — Registro e Identidad ────────────────────────────────────────────

// Rutas públicas de auth (no requieren token)
router.post('/auth/register', proxy(ZONA_A))
router.post('/auth/login', proxy(ZONA_A))
router.post('/auth/send-verification-code', proxy(ZONA_A))
router.get('/auth/captcha-required', proxy(ZONA_A))  // ← agregar esta línea


// Rutas protegidas de auth
router.get('/auth/me', authenticate, proxy(ZONA_A))

// Rutas de usuarios (admin ve todos, usuario ve su propio perfil)
router.get('/users', authenticate, authorize('admin'), proxy(ZONA_A))
router.get('/users/:id/profile', authenticate, proxy(ZONA_A))
router.patch('/users/:id/profile', authenticate, proxy(ZONA_A))

// ── ZONA B — Contenido y Aprendizaje ────────────────────────────────────────

// Contenidos (listado y detalle son públicos)
router.get('/contents', proxy(ZONA_B))
router.get('/contents/:id', proxy(ZONA_B))
router.post('/contents', authenticate, authorize('teacher', 'admin'), proxy(ZONA_B))
router.patch('/contents/:id', authenticate, authorize('teacher', 'admin'), proxy(ZONA_B))

// Tags (listado público, creación solo admin)
router.get('/tags', proxy(ZONA_B))
router.post('/tags', authenticate, authorize('admin'), proxy(ZONA_B))

// Rutas de aprendizaje
router.get('/paths', proxy(ZONA_B))
router.get('/paths/:id', proxy(ZONA_B))
router.post('/paths', authenticate, proxy(ZONA_B))

// Progreso
router.post('/progress', authenticate, proxy(ZONA_B))
router.get('/progress/:userId', authenticate, proxy(ZONA_B))

// Evaluaciones
router.post('/assessments', authenticate, proxy(ZONA_B))
router.post('/assessments/:id/results', authenticate, proxy(ZONA_B))

// Comentarios
router.post('/comments', authenticate, proxy(ZONA_B))
router.get('/comments/:contentId', proxy(ZONA_B))

// Calificaciones
router.post('/ratings', authenticate, proxy(ZONA_B))
router.get('/ratings/:contentId', proxy(ZONA_B))

router.post('/progress/enroll',      authenticate, proxy(ZONA_B))
router.get('/progress/enrollments',  authenticate, proxy(ZONA_B))

router.get('/users/security-logs',    authenticate, authorize('admin'), proxy(ZONA_A))
router.get('/users/failed-attempts',  authenticate, authorize('admin'), proxy(ZONA_A))

export default router