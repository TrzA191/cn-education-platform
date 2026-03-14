import { Request, Response } from 'express'
import { UserProgress } from '../models/UserProgress'
import { MultimediaContent } from '../models/MultimediaContent'

export const saveProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content_id, watched_seconds } = req.body
    const user_id = req.user!.userId

    const content = await MultimediaContent.findById(content_id)
    if (!content) {
      res.status(404).json({ error: 'Contenido no encontrado' })
      return
    }

    const completion_percentage = content.duration_seconds
      ? Math.min((watched_seconds / content.duration_seconds) * 100, 100)
      : 0

    const progress = await UserProgress.findOneAndUpdate(
      { user_id, content_id },
      {
        watched_seconds,
        completion_percentage,
        is_completed: completion_percentage >= 90,
        last_watched_at: new Date(),
      },
      { upsert: true, new: true }
    )

    res.json(progress)
  } catch (error) {
    console.error('[saveProgress]', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getUserProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const user_id = parseInt(req.params.userId)
    const progress = await UserProgress.find({ user_id }).populate('content_id')
    res.json(progress)
  } catch (error) {
    console.error('[getUserProgress]', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}