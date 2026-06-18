import { Router } from 'express'
import { saveProgress, getUserProgress, enrollPath, getEnrollments, getPathProgress } from '../controllers/progress.controller'
import { createAssessment, submitResult, getTeacherAssessmentResults, getAssessmentByContent } from '../controllers/assessments.controller'
import { addComment, getComments, addRating, getRatings } from '../controllers/comments.controller'
import { authenticate } from '../middlewares/auth.middleware'

const progressRouter = Router()
// IMPORTANTE: rutas específicas ANTES del wildcard /:userId
progressRouter.post('/enroll',      authenticate, enrollPath)
progressRouter.get('/enrollments',  authenticate, getEnrollments)
progressRouter.get('/path/:pathId', authenticate, getPathProgress)
progressRouter.post('/',            authenticate, saveProgress)
progressRouter.get('/:userId',      authenticate, getUserProgress)

const assessmentRouter = Router()
assessmentRouter.get('/teacher-results', authenticate, getTeacherAssessmentResults)
assessmentRouter.get('/content/:contentId', authenticate, getAssessmentByContent)
assessmentRouter.post('/', authenticate, createAssessment)
assessmentRouter.post('/:id/results', authenticate, submitResult)

const commentRouter = Router()
commentRouter.post('/', authenticate, addComment)
commentRouter.get('/:contentId', getComments)

const ratingRouter = Router()
ratingRouter.post('/', authenticate, addRating)
ratingRouter.get('/:contentId', getRatings)

export { progressRouter, assessmentRouter, commentRouter, ratingRouter }
