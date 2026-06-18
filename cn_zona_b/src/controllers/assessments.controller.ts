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

export const getAssessmentByContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentId } = req.params
    const assessment = await Assessment.findOne({ content_id: contentId })
    if (!assessment) {
      res.status(404).json({ error: 'Examen no encontrado' })
      return
    }
    res.json(assessment)
  } catch (error) {
    console.error('[getAssessmentByContent]', error)
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
      user_id: req.user!.id,
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

import { MultimediaContent } from '../models/MultimediaContent'

export const getTeacherAssessmentResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const authorId = req.user?.id
    if (!authorId) {
      res.status(401).json({ error: 'No autorizado' })
      return
    }

    // 1. Find all content by this author
    const contents = await MultimediaContent.find({ author_id: authorId }).select('_id title')
    const contentIds = contents.map(c => c._id)

    // 2. Find assessments for these contents
    const assessments = await Assessment.find({ content_id: { $in: contentIds } }).select('_id title content_id')
    const assessmentIds = assessments.map(a => a._id)

    // 3. Get recent results
    const results = await UserAssessmentResult.find({ assessment_id: { $in: assessmentIds } })
      .sort({ taken_at: -1 })
      .limit(50)
      .lean()

    // 4. Attach assessment info
    const enrichedResults = results.map(r => {
      const assessment = assessments.find(a => String(a._id) === String(r.assessment_id))
      const content = contents.find(c => String(c._id) === String(assessment?.content_id))
      return {
        ...r,
        assessment_title: assessment?.title || 'Unknown',
        content_title: content?.title || 'Unknown'
      }
    })

    res.json(enrichedResults)
  } catch (error) {
    console.error('[getTeacherAssessmentResults]', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
