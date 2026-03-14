import { Schema, model, Document, Types } from 'mongoose'

export interface IAssessment extends Document {
  content_id: Types.ObjectId
  title: string
  passing_score: number
}

const assessmentSchema = new Schema<IAssessment>({
  content_id: { type: Schema.Types.ObjectId, ref: 'MultimediaContent', required: true },
  title: { type: String, required: true },
  passing_score: { type: Number, min: 0, max: 100, required: true },
})

export const Assessment = model<IAssessment>('Assessment', assessmentSchema, 'assessments')

export interface IUserAssessmentResult extends Document {
  user_id: number
  assessment_id: Types.ObjectId
  score: number
  passed: boolean
  taken_at: Date
}

const resultSchema = new Schema<IUserAssessmentResult>({
  user_id: { type: Number, required: true },
  assessment_id: { type: Schema.Types.ObjectId, ref: 'Assessment', required: true },
  score: { type: Number, min: 0, max: 100, required: true },
  passed: { type: Boolean, required: true },
  taken_at: { type: Date, default: Date.now },
})

export const UserAssessmentResult = model<IUserAssessmentResult>('UserAssessmentResult', resultSchema, 'user_assessment_results')