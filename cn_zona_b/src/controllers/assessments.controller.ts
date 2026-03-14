import { Request, Response } from 'express'
import { Assessment, UserAssessmentResult } from '../models/Assessment'

export const createAssessment = async (req: Request, res: Response): Promise<void> => {
  try {
    const assessment = await Assessment.create(req.body)
    res.status(201).json(assessment)
  } catch (error) {
    console.error('[createAssessment]', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const submitResult = async (req: Request, res: Response): Promise<void> => {
  try {
    const assessment = await Assessment.findById(req.params.id)
    if (!assessment) {
      res.status(404).json({ error: 'Evaluación no encontrada' })
      return
    }

    const { score } = req.body
    const passed = score >= assessment.passing_score

    const result = await UserAssessmentResult.create({
      user_id: req.user!.userId,
      assessment_id: assessment._id,
      score,
      passed,
    })

    res.status(201).json(result)
  } catch (error) {
    console.error('[submitResult]', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
