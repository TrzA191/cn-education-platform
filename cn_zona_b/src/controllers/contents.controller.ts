import { Request, Response } from 'express'
import { MultimediaContent } from '../models/MultimediaContent'
import { uploadFileToBlob } from '../lib/azure'

export const createContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, content_type, duration_seconds, difficulty_level, tags } = req.body
    
    let cdn_url = req.body.cdn_url || null;

    console.log("FILE:", req.file); // Diagnóstico rápido sugerido

    if (!req.file && !cdn_url) {
      res.status(400).json({ error: "No se recibió ningún archivo (req.file is undefined)" });
      return;
    }

    if (req.file) {
      try {
        cdn_url = await uploadFileToBlob(req.file.buffer, req.file.originalname, req.file.mimetype);
        console.log("URL de Azure generada:", cdn_url);
      } catch (azureErr: any) {
        console.error("ERROR EN AZURE BLOB STORAGE:", azureErr);
        res.status(500).json({ error: "Fallo al subir a Azure: " + (azureErr.message || azureErr) });
        return;
      }
    }

    let parsedTags = tags;
    if (typeof tags === 'string') {
      try {
        parsedTags = JSON.parse(tags);
      } catch (e) {
        parsedTags = tags.split(',').filter(Boolean);
      }
    }

    const content = await MultimediaContent.create({
      title,
      description,
      content_type,
      duration_seconds: duration_seconds ? parseInt(duration_seconds) : null,
      difficulty_level,
      tags: parsedTags,
      cdn_url,
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