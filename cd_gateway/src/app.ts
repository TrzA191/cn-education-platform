import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import gatewayRoutes from './routes/gateway.routes'

const app = express()

app.use(helmet())
app.use(morgan('dev'))
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean),
  credentials: true,
}))
app.use(express.json())

// Health check del gateway
app.get('/health', (_, res) => {
  res.json({
    status: 'ok',
    service: 'gateway',
    zonaA: process.env.ZONA_A_URL,
    zonaB: process.env.ZONA_B_URL,
    timestamp: new Date()
  })
})

// Todas las rutas bajo /api pasan por el gateway
app.use('/api', gatewayRoutes)

app.use((_, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' })
})

export default app