import { Schema, model, Document, Types } from 'mongoose'

export interface IUserProgress extends Document {
  user_id: number
  content_id: Types.ObjectId
  watched_seconds: number
  completion_percentage: number
  is_completed: boolean
  last_watched_at: Date
}

const schema = new Schema<IUserProgress>({
  user_id: { type: Number, required: true },
  content_id: { type: Schema.Types.ObjectId, ref: 'MultimediaContent', required: true },
  watched_seconds: { type: Number, default: 0 },
  completion_percentage: { type: Number, default: 0 },
  is_completed: { type: Boolean, default: false },
  last_watched_at: { type: Date, default: Date.now },
})

export const UserProgress = model<IUserProgress>('UserProgress', schema, 'user_progress')