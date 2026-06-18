import { Schema, model, Document, Types } from 'mongoose'

export interface IUserEnrollment extends Document {
  user_id    : number
  path_id    : Types.ObjectId
  enrolled_at: Date
}

const schema = new Schema<IUserEnrollment>({
  user_id    : { type: Number, required: true },
  path_id    : { type: Schema.Types.ObjectId, ref: 'LearningPath', required: true },
  enrolled_at: { type: Date, default: Date.now },
})

schema.index({ user_id: 1, path_id: 1 }, { unique: true })

export const UserEnrollment = model<IUserEnrollment>('UserEnrollment', schema, 'user_enrollments')