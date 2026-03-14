import { Schema, model, Document, Types } from 'mongoose'

export interface IPathContent extends Document {
  path_id: Types.ObjectId
  content_id: Types.ObjectId
  sequence_order: number
}

const schema = new Schema<IPathContent>({
  path_id: { type: Schema.Types.ObjectId, ref: 'LearningPath', required: true },
  content_id: { type: Schema.Types.ObjectId, ref: 'MultimediaContent', required: true },
  sequence_order: { type: Number, required: true },
})

export const PathContent = model<IPathContent>('PathContent', schema, 'path_contents')