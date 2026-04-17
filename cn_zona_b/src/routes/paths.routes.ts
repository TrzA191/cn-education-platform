import { Router } from 'express'
import { createPath, listPaths, getPath, generateSystemPath } from '../controllers/paths.controller'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

router.get('/', listPaths)
router.post('/generate', authenticate, generateSystemPath)
router.get('/:id', getPath)
router.post('/', authenticate, createPath)

export default router
