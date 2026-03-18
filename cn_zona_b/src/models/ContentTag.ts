import { Schema, model, Document, Types } from 'mongoose'

export interface IContentTag extends Document {
  content_id: Types.ObjectId
  tag_id: Types.ObjectId
}

const schema = new Schema<IContentTag>({
  content_id: { type: Schema.Types.ObjectId, ref: 'MultimediaContent', required: true },
  tag_id: { type: Schema.Types.ObjectId, ref: 'Tag', required: true },
})

export const ContentTag = model<IContentTag>('ContentTag', schema, 'content_tags')