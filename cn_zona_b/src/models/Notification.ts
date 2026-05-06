import { Schema, model, Document, Types } from 'mongoose'

export interface INotification extends Document {
  user_id: number
  title: string
  message: string
  type: 'invitation' | 'content' | 'system'
  related_id?: string // e.g. content_id
  is_read: boolean
  created_at: Date
}

const notificationSchema = new Schema<INotification>({
  user_id: { type: Number, required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['invitation', 'content', 'system'], default: 'system' },
  related_id: { type: String },
  is_read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
})

export const Notification = model<INotification>('Notification', notificationSchema, 'notifications')
