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