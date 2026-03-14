import { Router } from 'express'
import { createTag, listTags } from '../controllers/tags.controller'
import { authenticate, authorize } from '../middlewares/auth.middleware'

const router = Router()

router.get('/', listTags)
router.post('/', authenticate, authorize('admin'), createTag)

export default router