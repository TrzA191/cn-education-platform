import { Router } from 'express'
import multer from 'multer'
import { createContent, listContents, getContent, updateContent } from '../controllers/contents.controller'
import { authenticate, authorize } from '../middlewares/auth.middleware'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

router.get('/', listContents)
router.get('/:id', getContent)
router.post('/', authenticate, authorize('teacher', 'admin'), upload.single('file'), createContent)
router.patch('/:id', authenticate, authorize('teacher', 'admin'), updateContent)

export default router
