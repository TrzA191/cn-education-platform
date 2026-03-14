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
    console.error('[listTags]', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}