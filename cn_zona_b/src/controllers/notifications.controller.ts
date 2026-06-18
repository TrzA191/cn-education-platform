import { Request, Response } from 'express'
import { Notification } from '../models/Notification'

export const listNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    const notifications = await Notification.find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(50)

    res.json(notifications)
  } catch (error) {
    console.error('[listNotifications]', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    await Notification.findByIdAndUpdate(id, { is_read: true })
    res.json({ success: true })
  } catch (error) {
    console.error('[markAsRead]', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    await Notification.updateMany({ user_id: userId, is_read: false }, { is_read: true })
    res.json({ success: true })
  } catch (error) {
    console.error('[markAllAsRead]', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
