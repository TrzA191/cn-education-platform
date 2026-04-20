import { Request, Response } from 'express'
import { LearningPath } from '../models/LearningPath'
import { PathContent } from '../models/PathContent'
import { UserInterest } from '../models/UserInterest'
import { MultimediaContent } from '../models/MultimediaContent'
import { UserEnrollment } from '../models/UserEnrollment'

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
    const creatorId = req.user!.id
    const { status } = req.query
    const query: any = { creator_id: creatorId }
    
    if (status) {
      query.status = status
    } else {
      query.status = 'active'
    }

    const paths = await LearningPath.find(query).sort({ created_at: -1 })
    res.json(paths)
  } catch (error) {
    console.error('[listPaths]', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getPath = async (req: Request, res: Response): Promise<void> => {
  try {
    const creatorId = req.user!.id
    const path = await LearningPath.findOne({ _id: req.params.id, creator_id: creatorId })
    if (!path) {
      res.status(404).json({ error: 'Ruta no encontrada o no tienes permiso para verla' })
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

export const updatePath = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const creatorId = req.user!.id
    const path = await LearningPath.findOneAndUpdate(
      { _id: id, creator_id: creatorId },
      { $set: req.body },
      { new: true }
    )
    if (!path) {
      res.status(404).json({ error: 'Ruta no encontrada' })
      return
    }
    res.json(path)
  } catch (error) {
    console.error('[updatePath]', error)
    res.status(500).json({ error: 'Error al actualizar ruta' })
  }
}

export const deletePath = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const creatorId = req.user!.id

    const path = await LearningPath.findOne({ _id: id, creator_id: creatorId })
    if (!path) {
      res.status(404).json({ error: 'Ruta no encontrada' })
      return
    }

    if (path.status === 'active') {
      path.status = 'archived'
      await path.save()
      res.json({ message: 'Ruta archivada correctamente', status: 'archived' })
    } else {
      await PathContent.deleteMany({ path_id: id })
      await UserEnrollment.deleteMany({ path_id: id })
      await LearningPath.deleteOne({ _id: id })
    res.json({ message: 'Ruta eliminada permanentemente', status: 'deleted' })
    }
  } catch (error) {
    console.error('[deletePath]', error)
    res.status(500).json({ error: 'Error al procesar eliminación' })
  }
}

export const addPathContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { path_id, content_id, sequence_order } = req.body
    const creatorId = req.user!.id

    // Verificar que la ruta le pertenece al usuario
    const path = await LearningPath.findOne({ _id: path_id, creator_id: creatorId })
    if (!path) {
      res.status(404).json({ error: 'Ruta no encontrada' })
      return
    }

    const item = await PathContent.create({ path_id, content_id, sequence_order })
    res.status(201).json(item)
  } catch (error) {
    console.error('[addPathContent]', error)
    res.status(500).json({ error: 'Error al agregar contenido' })
  }
}

export const removePathContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentItemId } = req.params
    await PathContent.deleteOne({ _id: contentItemId })
    res.json({ message: 'Contenido eliminado de la ruta' })
  } catch (error) {
    console.error('[removePathContent]', error)
    res.status(500).json({ error: 'Error al eliminar contenido' })
  }
}

export const generateSystemPath = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id

    const interests = await UserInterest.find({ user_id: userId }).populate('tag_id')
    if (!interests || interests.length === 0) {
      res.status(400).json({ error: 'No tienes intereses configurados. Ve a tu perfil para seleccionarlos.' })
      return
    }

    const tagNames = interests
      .map((i: any) => i.tag_id?.name)
      .filter(Boolean)

    const displayTags = tagNames.slice(0, 3).join(', ') + (tagNames.length > 3 ? '...' : '')
    const fullTagList = tagNames.join(', ')

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
      title: tagNames.length > 0 ? `Ruta de: ${displayTags}` : 'Ruta Sugerida: Basada en tus intereses',
      description: tagNames.length > 0 
        ? `Ruta personalizada enfocada en: ${fullTagList}.` 
        : 'Generada automáticamente para mejorar tus habilidades.',
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