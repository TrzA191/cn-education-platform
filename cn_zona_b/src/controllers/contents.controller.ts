import { Request, Response } from 'express'
import { MultimediaContent } from '../models/MultimediaContent'

export const createContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const content = await MultimediaContent.create({
      ...req.body,
      author_id: req.user!.id,
    })
    res.status(201).json(content)
  } catch (error) {
    console.error('[createContent]', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const listContents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content_type, difficulty_level } = req.query

    const query: any = { status: 'active' }

    if (title) {
      query.title = { $regex: title, $options: 'i' }
    }

    if (content_type) {
      query.content_type = content_type
    }

    if (difficulty_level) {
      query.difficulty_level = difficulty_level
    }

    const contents = await MultimediaContent.find(query).sort({ created_at: -1 })
    res.json(contents)
  } catch (error) {
    console.error('[listContents]', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const content = await MultimediaContent.findById(req.params.id)
    if (!content) {
      res.status(404).json({ error: 'Contenido no encontrado' })
      return
    }
    res.json(content)
  } catch (error) {
    console.error('[getContent]', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const updateContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const content = await MultimediaContent.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
    if (!content) {
      res.status(404).json({ error: 'Contenido no encontrado' })
      return
    }
    res.json(content)
  } catch (error) {
    console.error('[updateContent]', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}