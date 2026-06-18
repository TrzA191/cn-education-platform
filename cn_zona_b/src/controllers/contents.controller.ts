import { Request, Response } from 'express'
import { MultimediaContent } from '../models/MultimediaContent'
import { uploadFileToBlob } from '../lib/azure'
import { Tag } from '../models/Tag'
import { Notification } from '../models/Notification'

const ZONA_A_INTERNAL = 'http://127.0.0.1:3000/api'

export const createContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      title, 
      description, 
      body_content, 
      content_type, 
      duration_seconds, 
      difficulty_level, 
      tags, 
      is_introductory, 
      status, 
      visibility, 
      allowed_emails 
    } = req.body
    
    let cdn_url = req.body.cdn_url || null;

    console.log("FILE:", req.file);

    if (!req.file && !cdn_url) {
      res.status(400).json({ error: "No se recibió ningún archivo (req.file is undefined)" });
      return;
    }

    let finalDurationSeconds = duration_seconds ? parseInt(duration_seconds) : null;

    if (req.file) {
      try {
        if (req.file.mimetype.startsWith('video/')) {
          try {
            const { getVideoDurationInSeconds } = require('get-video-duration');
            const { Readable } = require('stream');
            const stream = Readable.from(req.file.buffer);
            const durationStr = await getVideoDurationInSeconds(stream);
            if (durationStr) {
              finalDurationSeconds = Math.round(Number(durationStr));
              console.log(`[Content] Duración detectada automáticamente: ${finalDurationSeconds}s`);
            }
          } catch (durErr) {
            console.error("ERROR detectando duración de video:", durErr);
          }
        }
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

    // RESOLVER EMAILS A IDs
    let parsedAllowedStudents: number[] = []
    if (allowed_emails) {
      const emailList = typeof allowed_emails === 'string' 
        ? allowed_emails.split(',').map(e => e.trim()).filter(Boolean)
        : allowed_emails;
      
      console.log(`[Content] Resolviendo emails:`, emailList);

      try {
        const response = await fetch(`${ZONA_A_INTERNAL}/users/by-emails`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': req.headers.authorization || ''
          },
          body: JSON.stringify({ emails: emailList })
        });
        const users = await response.json() as any[];
        console.log(`[Content] Usuarios encontrados en Zona A:`, users);
        parsedAllowedStudents = users.map(u => u.id);
      } catch (err) {
        console.error("Error al resolver emails:", err);
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
      duration_seconds: finalDurationSeconds,
      difficulty_level,
      is_introductory: is_introductory === 'true' || is_introductory === true,
      tags: tagIds,
      cdn_url,
      author_id: req.user!.id,
      status: status || 'active',
      visibility: visibility || 'public',
      allowed_students: parsedAllowedStudents
    })
    // CREAR NOTIFICACIONES para los alumnos invitados
    if (parsedAllowedStudents.length > 0) {
      console.log(`[Content] Creando notificaciones para IDs:`, parsedAllowedStudents);
      await Promise.all(parsedAllowedStudents.map(studentId => 
        Notification.create({
          user_id: studentId,
          title: 'Nueva invitación a contenido privado',
          message: `Has sido invitado a ver el contenido: ${title}`,
          type: 'invitation',
          related_id: content._id
        })
      ));
      console.log(`[Content] Notificaciones creadas exitosamente.`);
    }

    res.status(201).json(content)
  } catch (error) {
    console.error('[createContent]', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const listContents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content_type, difficulty_level, author_id } = req.query

    const query: any = { status: 'active' }

    if (content_type) {
      query.content_type = content_type
    }

    if (difficulty_level) {
      query.difficulty_level = difficulty_level
    }

    if (author_id) {
      query.author_id = author_id
    }

    const andConditions: any[] = []

    const titleStr = Array.isArray(title) ? title[0] : title;
    if (titleStr) {
      const searchRegex = { $regex: titleStr, $options: 'i' }
      
      // Buscar etiquetas que coincidan con la búsqueda
      const matchingTags = await Tag.find({ name: searchRegex }).select('_id')
      const tagIds = matchingTags.map(t => t._id)

      andConditions.push({
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { tags: { $in: tagIds } }
        ]
      })
    }

    // Filtro de visibilidad inteligente
    const userId = req.user?.id || -1;
    
    // Un usuario ve contenido si:
    // 1. Es público
    // 2. Es privado pero está en la lista de permitidos
    // 3. Es el autor (siempre ve lo suyo)
    andConditions.push({
      $or: [
        { visibility: { $ne: 'private' } },
        { visibility: 'private', allowed_students: userId },
        { author_id: userId }
      ]
    })

    if (andConditions.length > 0) {
      query.$and = andConditions
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
    const { allowed_emails, ...updateData } = req.body

    // RESOLVER EMAILS A IDs SI VIENEN
    if (allowed_emails !== undefined) {
      const emailList = typeof allowed_emails === 'string' 
        ? allowed_emails.split(',').map(e => e.trim()).filter(Boolean)
        : allowed_emails;

      try {
        const response = await fetch(`${ZONA_A_INTERNAL}/users/by-emails`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': req.headers.authorization || ''
          },
          body: JSON.stringify({ emails: emailList })
        });
        const users = await response.json() as any[];
        updateData.allowed_students = users.map(u => u.id);
      } catch (err) {
        console.error("Error al resolver emails en update:", err);
      }
    }

    const content = await MultimediaContent.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
    if (!content) {
      res.status(404).json({ error: 'Contenido no encontrado' })
      return
    }

    // Si se agregaron alumnos nuevos, notificarles
    if (allowed_emails && updateData.allowed_students?.length > 0) {
      await Promise.all(updateData.allowed_students.map((studentId: number) => 
        Notification.create({
          user_id: studentId,
          title: 'Acceso a contenido privado actualizado',
          message: `Has sido invitado o se ha actualizado tu acceso al contenido: ${content.title}`,
          type: 'invitation',
          related_id: content._id
        })
      ));
    }

    res.json(content)
  } catch (error) {
    console.error('[updateContent]', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}