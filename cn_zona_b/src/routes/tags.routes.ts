import { Router } from 'express'
import { createTag, listTags, getUserInterests, updateUserInterests } from '../controllers/tags.controller'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

router.get('/', listTags)
router.post('/', authenticate, createTag)

// Interests routes
router.get('/interests/me', authenticate, getUserInterests)
router.put('/interests/me', authenticate, updateUserInterests)

export default router