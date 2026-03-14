import { Schema, model, Document } from 'mongoose'

export interface ILearningPath extends Document {
  title: string
  description?: string
  creator_id: number
  difficulty_level: 'basico' | 'intermedio' | 'avanzado'
  is_system_generated: boolean
  created_at: Date
}

const schema = new Schema<ILearningPath>({
  title: { type: String, required: true },
  description: { type: String },
  creator_id: { type: Number, required: true },
  difficulty_level: { type: String, enum: ['basico', 'intermedio', 'avanzado'], default: 'basico' },
  is_system_generated: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
})

export const LearningPath = model<ILearningPath>('LearningPath', schema, 'learning_paths')