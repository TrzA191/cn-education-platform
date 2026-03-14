import { Router } from 'express'
import { createPath, listPaths, getPath } from '../controllers/paths.controller'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

router.get('/', listPaths)
router.get('/:id', getPath)
router.post('/', authenticate, createPath)

export default router
