import { Request, Response } from 'express'
import { MultimediaContent } from '../models/MultimediaContent'
import { uploadFileToBlob } from '../lib/azure'
import { Tag } from '../models/Tag'


export const createContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, body_content, content_type, duration_seconds, difficulty_level, tags, is_introductory, status } = req.body
    
    let cdn_url = req.body.cdn_url || null;

    console.log("FILE:", req.file);

    if (!req.file && !cdn_url) {
      res.status(400).json({ error: "No se recibió ningún archivo (req.file is undefined)" });
      return;
    }

    if (req.file) {
      try {
        cdn_url = await uploadFileToBlob(req.file.buffer, req.file.originalname, req.file.mimetype);
      } catch (azureErr: any) {
        console.error("ERROR EN AZURE BLOB STORAGE:", azureErr);
        res.status(500).json({ error: "Fallo al subir a Azure: " + (azureErr.message || azureErr) });
        return;
      }
    }

    let parsedTags: string[] = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        parsedTags = String(tags).split(',').filter(Boolean);
      }
    }

    // RESOLVER ETIQUETAS: Buscar o Crear
    const tagIds = await Promise.all(
      parsedTags.map(async (tagInput: string) => {
        const str = tagInput.trim();
        // Si parece un ObjectId válido (24 caracteres hexadecimales)
        if (/^[a-fA-F0-9]{24}$/.test(str)) {
          const existingTag = await Tag.findById(str);
          if (existingTag) return existingTag._id;
        }
        
        // Si no es un ID válido o no se encontró, lo buscamos por nombre
        let tag = await Tag.findOne({ name: { $regex: new RegExp(`^${str}$`, 'i') } });
        if (!tag) {
          tag = await Tag.create({ name: str, category: 'general', language: 'es' });
        }
        return tag._id;
      })
    );


    const content = await MultimediaContent.create({
      title,
      description,
      body_content,
      content_type,
      duration_seconds: duration_seconds ? parseInt(duration_seconds) : null,
      difficulty_level,
      is_introductory: is_introductory === 'true' || is_introductory === true,
      tags: tagIds,
      cdn_url,
      author_id: req.user!.id,
      status: status || 'active'
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

    const contents = await MultimediaContent.find(query)
      .populate('tags')
      .sort({ created_at: -1 })
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