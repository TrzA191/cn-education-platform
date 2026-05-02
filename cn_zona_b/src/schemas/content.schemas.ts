import { z } from 'zod';

export const createContentSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'El título debe tener al menos 3 caracteres').max(150, 'El título es demasiado largo'),
    description: z.string().min(3, 'La descripción debe tener al menos 3 caracteres').max(1000, 'La descripción no puede exceder los 1000 caracteres'),
    content_type: z.enum(['video', 'pdf', 'texto']),
    difficulty_level: z.enum(['basico', 'intermedio', 'avanzado']),
    
    // multer parsea todo a string, así que aceptamos duration_seconds como string
    duration_seconds: z.string().optional().refine((val) => {
      if (!val) return true;
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 0;
    }, { message: 'La duración debe ser un número válido' }),
    
    tags: z.string().optional(),
    cdn_url: z.string().url().optional().or(z.literal('')),
  }),
});
