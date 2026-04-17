import { Request, Response } from 'express'
import { LearningPath } from '../models/LearningPath'
import { PathContent } from '../models/PathContent'

export const createPath = async (req: Request, res: Response): Promise<void> => {
  try {
    const path = await LearningPath.create({
      ...req.body,
      creator_id: req.user!.id,
    })
    res.status(201).json(path)
  } catch (error) {
    console.error('[createPath]', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const listPaths = async (req: Request, res: Response): Promise<void> => {
  try {
    const paths = await LearningPath.find().sort({ created_at: -1 })
    res.json(paths)
  } catch (error) {
    console.error('[listPaths]', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getPath = async (req: Request, res: Response): Promise<void> => {
  try {
    const path = await LearningPath.findById(req.params.id)
    if (!path) {
      res.status(404).json({ error: 'Ruta no encontrada' })
      return
    }
    const contents = await PathContent.find({ path_id: path._id })
      .populate('content_id')
      .sort({ sequence_order: 1 })

    res.json({ path, contents })
  } catch (error) {
    console.error('[getPath]', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

import { UserInterest } from '../models/UserInterest'
import { MultimediaContent } from '../models/MultimediaContent'
import { UserEnrollment } from '../models/UserEnrollment'

export const generateSystemPath = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id
    
    const interests = await UserInterest.find({ user_id: userId })
    if (!interests || interests.length === 0) {
      res.status(400).json({ error: 'No tienes intereses configurados. Ve a tu perfil para seleccionarlos.' })
      return
    }

    const tagIds = interests.map(i => i.tag_id)
    const contents = await MultimediaContent.find({ 
      tags: { $in: tagIds },
      status: 'active'
    })

    if (contents.length === 0) {
      res.status(404).json({ error: 'No hay contenidos suficientes para tus intereses.' })
      return
    }

    // Ordenar por dificultad: básico -> intermedio -> avanzado
    const difficultyOrder: Record<string, number> = { 'basico': 1, 'intermedio': 2, 'avanzado': 3 }
    const sortedContents = contents.sort((a, b) => {
      const diffA = a.difficulty_level ? difficultyOrder[a.difficulty_level] : 0
      const diffB = b.difficulty_level ? difficultyOrder[b.difficulty_level] : 0
      return diffA - diffB
    })

    const path = await LearningPath.create({
      title: 'Ruta Sugerida: Basada en tus intereses',
      description: 'Generada automáticamente para mejorar tus habilidades.',
      creator_id: userId,
      difficulty_level: 'basico', // O un promedio
      is_system_generated: true
    })

    let sequence = 1
    const pathContents = await Promise.all(sortedContents.map(c => 
      PathContent.create({
        path_id: path._id,
        content_id: c._id,
        sequence_order: sequence++
      })
    ))

    const enrollment = await UserEnrollment.create({
      user_id: userId,
      path_id: path._id,
      status: 'activo'
    })

    res.status(201).json({ path, pathContents, enrollment })
  } catch (error) {
    console.error('[generateSystemPath]', error)
    res.status(500).json({ error: 'Error al generar ruta automática' })
  }
}