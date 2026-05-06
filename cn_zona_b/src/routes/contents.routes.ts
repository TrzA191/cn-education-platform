import { Router } from 'express'
import multer from 'multer'
import { createContent, listContents, getContent, updateContent } from '../controllers/contents.controller'
import { authenticate, authorize } from '../middlewares/auth.middleware'

import { validate } from '../middlewares/validate.middleware'
import { createContentSchema } from '../schemas/content.schemas'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

router.get('/', authenticate, listContents)
router.get('/:id', authenticate, getContent)
router.post('/', authenticate, authorize('teacher', 'admin'), upload.single('file'), validate(createContentSchema), createContent)
router.patch('/:id', authenticate, authorize('teacher', 'admin'), updateContent)

export default router
