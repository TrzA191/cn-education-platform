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
router.post('/auth/verify', proxy(ZONA_A))
router.post('/auth/forgot-password', proxy(ZONA_A))
router.post('/auth/reset-password', proxy(ZONA_A))
router.post('/auth/send-verification-code', proxy(ZONA_A)) // Alias retrocompatible
router.get('/auth/captcha-required', proxy(ZONA_A))


// Rutas protegidas de auth
router.get('/auth/me', authenticate, proxy(ZONA_A))

// Rutas de usuarios (admin ve todos, usuario ve su propio perfil)
router.get('/users', authenticate, authorize('admin'), proxy(ZONA_A))
router.post('/users', authenticate, authorize('admin'), proxy(ZONA_A))
router.patch('/users/:id', authenticate, authorize('admin'), proxy(ZONA_A))
router.post('/users/:id/toggle-block', authenticate, authorize('admin'), proxy(ZONA_A))

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

// Tags - User Interests
router.get('/tags/interests/me', authenticate, proxy(ZONA_B))
router.put('/tags/interests/me', authenticate, proxy(ZONA_B))

// Rutas de aprendizaje
router.get('/paths', authenticate, proxy(ZONA_B))
router.post('/paths/generate', authenticate, proxy(ZONA_B))
router.post('/paths/contents', authenticate, proxy(ZONA_B))
router.delete('/paths/contents/:contentItemId', authenticate, proxy(ZONA_B))
router.get('/paths/:id', authenticate, proxy(ZONA_B))
router.post('/paths', authenticate, proxy(ZONA_B))
router.put('/paths/:id', authenticate, proxy(ZONA_B))
router.delete('/paths/:id', authenticate, proxy(ZONA_B))

// Progreso — rutas específicas ANTES del wildcard /:userId
router.post('/progress/enroll', authenticate, proxy(ZONA_B))
router.get('/progress/enrollments', authenticate, proxy(ZONA_B))
router.get('/progress/path/:pathId', authenticate, proxy(ZONA_B))
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

router.get('/users/security-logs', authenticate, authorize('admin'), proxy(ZONA_A))
router.get('/users/failed-attempts', authenticate, authorize('admin'), proxy(ZONA_A))
router.get('/users/audit-trail', authenticate, authorize('admin'), proxy(ZONA_A))

export default router