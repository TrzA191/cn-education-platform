import { Schema, model, Document } from 'mongoose'

export interface ITag extends Document {
  name: string
  category?: string
  language: string
}

const schema = new Schema<ITag>({
  name: { type: String, required: true, unique: true },
  category: { type: String },
  language: { type: String, default: 'es' },
})

export const Tag = model<ITag>('Tag', schema, 'tags')