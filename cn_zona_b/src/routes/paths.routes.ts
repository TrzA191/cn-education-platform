import { Router } from 'express'
import { createPath, listPaths, getPath, generateSystemPath, updatePath, deletePath, addPathContent, removePathContent } from '../controllers/paths.controller'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

router.get('/', authenticate, listPaths)
router.post('/generate', authenticate, generateSystemPath)
router.get('/:id', authenticate, getPath)
router.post('/', authenticate, createPath)
router.put('/:id', authenticate, updatePath)
router.delete('/:id', authenticate, deletePath)

// Gestión de módulos dentro de una ruta
router.post('/contents', authenticate, addPathContent)
router.delete('/contents/:contentItemId', authenticate, removePathContent)

export default router
