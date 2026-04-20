import { Router } from 'express'
import { createPath, listPaths, getPath, generateSystemPath } from '../controllers/paths.controller'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

router.get('/', authenticate, listPaths)
router.post('/generate', authenticate, generateSystemPath)
router.get('/:id', authenticate, getPath)
router.post('/', authenticate, createPath)

export default router
