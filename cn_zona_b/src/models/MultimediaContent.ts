import { Schema, model, Document } from 'mongoose'

export interface IMultimediaContent extends Document {
  title: string
  description?: string
  content_type: string // <-- ¡Campo añadido!
  blob_storage_url?: string
  cdn_url?: string
  author_id: number
  duration_seconds?: number
  status: 'draft' | 'processing' | 'active' | 'inactive'
  tags: Schema.Types.ObjectId[]
  difficulty_level?: 'basico' | 'intermedio' | 'avanzado'
  created_at: Date
}

const schema = new Schema<IMultimediaContent>({
  title: { type: String, required: true },
  description: { type: String },
  // <-- ¡Campo añadido con validación estricta!
  content_type: { 
    type: String, 
    required: true,
    enum: ['video', 'pdf', 'texto'] 
  },
  blob_storage_url: { type: String },
  cdn_url: { type: String },
  author_id: { type: Number, required: true },
  duration_seconds: { type: Number },
  status: { type: String, enum: ['draft', 'processing', 'active', 'inactive'], default: 'draft' },
  tags: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
  difficulty_level: { type: String, enum: ['basico', 'intermedio', 'avanzado'] },
  created_at: { type: Date, default: Date.now },
})

export const MultimediaContent = model<IMultimediaContent>('MultimediaContent', schema, 'multimedia_contents')