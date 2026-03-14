import { Router } from 'express'
import { createContent, listContents, getContent, updateContent } from '../controllers/contents.controller'
import { authenticate, authorize } from '../middlewares/auth.middleware'

const router = Router()

router.get('/', listContents)
router.get('/:id', getContent)
router.post('/', authenticate, authorize('teacher', 'admin'), createContent)
router.patch('/:id', authenticate, authorize('teacher', 'admin'), updateContent)

export default router
