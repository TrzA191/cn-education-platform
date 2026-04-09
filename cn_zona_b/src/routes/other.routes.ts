import { Router } from 'express'
import { saveProgress, getUserProgress, enrollPath, getEnrollments } from '../controllers/progress.controller'
import { createAssessment, submitResult } from '../controllers/assessments.controller'
import { addComment, getComments, addRating, getRatings } from '../controllers/comments.controller'
import { authenticate } from '../middlewares/auth.middleware'

const progressRouter = Router()
progressRouter.post('/', authenticate, saveProgress)
progressRouter.get('/:userId', authenticate, getUserProgress)

const assessmentRouter = Router()
assessmentRouter.post('/', authenticate, createAssessment)
assessmentRouter.post('/:id/results', authenticate, submitResult)

const commentRouter = Router()
commentRouter.post('/', authenticate, addComment)
commentRouter.get('/:contentId', getComments)

const ratingRouter = Router()
ratingRouter.post('/', authenticate, addRating)
ratingRouter.get('/:contentId', getRatings)

progressRouter.post('/enroll',       authenticate, enrollPath)
progressRouter.get('/enrollments',   authenticate, getEnrollments)

export { progressRouter, assessmentRouter, commentRouter, ratingRouter }
