import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import contentsRoutes from './routes/contents.routes'
import tagsRoutes from './routes/tags.routes'
import pathsRoutes from './routes/paths.routes'
import notificationsRoutes from './routes/notifications.routes'
import { progressRouter, assessmentRouter, commentRouter, ratingRouter } from './routes/other.routes'

const app = express()

app.use(helmet())
app.use(morgan('dev'))
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean),
  credentials: true,
}))
app.use(express.json())

app.get('/health', (_, res) => {
  res.json({ status: 'ok', zone: 'B', service: 'contenido-aprendizaje', timestamp: new Date() })
})

app.use('/api/contents', contentsRoutes)
app.use('/api/tags', tagsRoutes)
app.use('/api/paths', pathsRoutes)
app.use('/api/progress', progressRouter)
app.use('/api/assessments', assessmentRouter)
app.use('/api/comments', commentRouter)
app.use('/api/ratings', ratingRouter)
app.use('/api/notifications', notificationsRoutes)

app.use((_, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' })
})

export default app
