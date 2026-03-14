import { Schema, model, Document, Types } from 'mongoose'

export interface IComment extends Document {
  user_id: number
  content_id: Types.ObjectId
  body: string
  created_at: Date
}

const commentSchema = new Schema<IComment>({
  user_id: { type: Number, required: true },
  content_id: { type: Schema.Types.ObjectId, ref: 'MultimediaContent', required: true },
  body: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
})

export const Comment = model<IComment>('Comment', commentSchema, 'comments')

export interface IContentRating extends Document {
  user_id: number
  content_id: Types.ObjectId
  rating_stars: number
  created_at: Date
}

const ratingSchema = new Schema<IContentRating>({
  user_id: { type: Number, required: true },
  content_id: { type: Schema.Types.ObjectId, ref: 'MultimediaContent', required: true },
  rating_stars: { type: Number, min: 1, max: 5, required: true },
  created_at: { type: Date, default: Date.now },
})

export const ContentRating = model<IContentRating>('ContentRating', ratingSchema, 'content_ratings')