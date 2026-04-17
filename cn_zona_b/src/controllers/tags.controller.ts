import { Request, Response } from 'express'
import { Tag } from '../models/Tag'

export const createTag = async (req: Request, res: Response): Promise<void> => {
  try {
    const tag = await Tag.create(req.body)
    res.status(201).json(tag)
  } catch (error) {
    console.error('[createTag]', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const listTags = async (req: Request, res: Response): Promise<void> => {
  try {
    const tags = await Tag.find().sort({ name: 1 })
    res.json(tags)
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

import { UserInterest } from '../models/UserInterest'

export const getUserInterests = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id
    const interests = await UserInterest.find({ user_id: userId }).populate('tag_id')
    res.json(interests)
  } catch (error) {
    console.error('[getUserInterests]', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const updateUserInterests = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id
    const { tagIds } = req.body // Array of Tag ObjectIds

    if (!Array.isArray(tagIds)) {
      res.status(400).json({ error: 'tagIds debe ser un arreglo' })
      return
    }

    // Replace old interests with new ones
    await UserInterest.deleteMany({ user_id: userId })
    
    if (tagIds.length > 0) {
      const newInterests = tagIds.map(tagId => ({
        user_id: userId,
        tag_id: tagId,
        weight_score: 100 // Default score para empezar
      }))
      await UserInterest.insertMany(newInterests)
    }

    res.json({ message: 'Intereses actualizados correctamente' })
  } catch (error) {
    console.error('[updateUserInterests]', error)
    res.status(500).json({ error: 'Error al actualizar intereses' })
  }
}