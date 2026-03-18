import { Schema, model, Document, Types } from 'mongoose'

export interface IUserInterest extends Document {
  user_id: number
  tag_id: Types.ObjectId
  weight_score: number
  updated_at: Date
}

const schema = new Schema<IUserInterest>({
  user_id: { type: Number, required: true },
  tag_id: { type: Schema.Types.ObjectId, ref: 'Tag', required: true },
  weight_score: { type: Number, default: 50 },
  updated_at: { type: Date, default: Date.now },
})

export const UserInterest = model<IUserInterest>('UserInterest', schema, 'user_interests')