import { Request, Response } from 'express'
import { UserProgress } from '../models/UserProgress'
import { MultimediaContent } from '../models/MultimediaContent'
import { LearningPath } from '../models/LearningPath'
import { PathContent } from '../models/PathContent'
import { UserEnrollment } from '../models/UserEnrollment'

export const saveProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content_id, watched_seconds } = req.body
    const user_id = req.user!.id

    const content = await MultimediaContent.findById(content_id)
    if (!content) {
      res.status(404).json({ error: 'Contenido no encontrado' })
      return
    }

    let existingProgress = await UserProgress.findOne({ user_id, content_id })

    const completion_percentage = content.duration_seconds
      ? Math.min((watched_seconds / content.duration_seconds) * 100, 100)
      : 0

    const is_completed_now = completion_percentage >= 90

    if (existingProgress) {
      // Evitar que el progreso retroceda si el estudiante retrasa el video
      const newMaxPercentage = Math.max(existingProgress.completion_percentage || 0, completion_percentage)
      const newMaxSeconds = Math.max(existingProgress.watched_seconds || 0, watched_seconds)
      
      existingProgress.watched_seconds = newMaxSeconds
      existingProgress.completion_percentage = newMaxPercentage
      existingProgress.is_completed = existingProgress.is_completed || is_completed_now
      existingProgress.last_watched_at = new Date()
      await existingProgress.save()
      res.json(existingProgress)
    } else {
      const newProgress = await UserProgress.create({
        user_id,
        content_id,
        watched_seconds,
        completion_percentage,
        is_completed: is_completed_now,
        last_watched_at: new Date()
      })
      res.json(newProgress)
    }
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


export const enrollPath = async (req: Request, res: Response): Promise<void> => {
  try {
    const { path_id } = req.body
    const user_id = req.user!.id

    const path = await LearningPath.findById(path_id)
    if (!path) {
      res.status(404).json({ error: 'Ruta no encontrada' })
      return
    }

    const existing = await UserEnrollment.findOne({ user_id, path_id })
    if (existing) {
      res.status(409).json({ error: 'Ya estás inscrito en esta ruta', enrolled: true })
      return
    }

    const enrollment = await UserEnrollment.create({ user_id, path_id })
    res.status(201).json({ message: 'Inscripción exitosa', enrollment })
  } catch (error) {
    console.error('[enrollPath]', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getEnrollments = async (req: Request, res: Response): Promise<void> => {
  try {
    const user_id = req.user!.id
    const enrollments = await UserEnrollment.find({ user_id }).populate('path_id')
    res.json(enrollments)
  } catch (error) {
    console.error('[getEnrollments]', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

/**
 * GET /progress/path/:pathId
 * Retorna el porcentaje real de avance del usuario en una ruta,
 * cruzando los PathContent de la ruta con los UserProgress del usuario.
 */
export const getPathProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const user_id = req.user!.id
    const { pathId } = req.params

    // Lista de contenidos de la ruta
    const pathContents = await PathContent.find({ path_id: pathId })
    const total = pathContents.length

    if (total === 0) {
      res.json({ total: 0, completed: 0, percentage: 0, contentProgress: [] })
      return
    }

    const contentIds = pathContents.map(pc => pc.content_id)

    // Progreso real del usuario para esos contenidos
    const progressRecords = await UserProgress.find({
      user_id,
      content_id: { $in: contentIds },
    })

    const completedSet = new Set(
      progressRecords
        .filter(p => p.is_completed)
        .map(p => p.content_id.toString())
    )

    const completed = completedSet.size
    const percentage = Math.round((completed / total) * 100)

    // Mapa content_id -> progreso para el frontend
    const contentProgress = progressRecords.map(p => ({
      content_id: p.content_id.toString(),
      is_completed: p.is_completed,
      completion_percentage: p.completion_percentage,
    }))

    res.json({ total, completed, percentage, contentProgress })
  } catch (error) {
    console.error('[getPathProgress]', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}