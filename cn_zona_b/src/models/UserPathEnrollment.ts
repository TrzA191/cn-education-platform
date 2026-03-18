import { Schema, model, Document, Types } from 'mongoose'

export interface IUserPathEnrollment extends Document {
  user_id: number
  path_id: Types.ObjectId
  status: 'activo' | 'completado' | 'abandonado'
  enrolled_at: Date
  completed_at?: Date
}

const schema = new Schema<IUserPathEnrollment>({
  user_id: { type: Number, required: true },
  path_id: { type: Schema.Types.ObjectId, ref: 'LearningPath', required: true },
  status: { type: String, enum: ['activo', 'completado', 'abandonado'], default: 'activo' },
  enrolled_at: { type: Date, default: Date.now },
  completed_at: { type: Date },
})

export const UserPathEnrollment = model<IUserPathEnrollment>('UserPathEnrollment', schema, 'user_path_enrollments')