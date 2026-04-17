import { Schema, model, Document } from 'mongoose'

export interface IUserInterest extends Document {
  user_id: number;
  tag_id: Schema.Types.ObjectId;
  weight_score: number;
  updated_at: Date;
}

const schema = new Schema<IUserInterest>({
  user_id: { type: Number, required: true },
  tag_id: { type: Schema.Types.ObjectId, ref: 'Tag', required: true },
  weight_score: { type: Number, default: 100, min: 0, max: 100 },
  updated_at: { type: Date, default: Date.now },
});

// Índice compuesto para que un usuario no duplique el mismo interés
schema.index({ user_id: 1, tag_id: 1 }, { unique: true });

export const UserInterest = model<IUserInterest>('UserInterest', schema, 'user_interests');
