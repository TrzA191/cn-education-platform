import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware'
import { listNotifications, markAsRead, markAllAsRead } from '../controllers/notifications.controller'

const router = Router()

router.get('/', authenticate, listNotifications)
router.patch('/:id/read', authenticate, markAsRead)
router.post('/read-all', authenticate, markAllAsRead)

export default router
