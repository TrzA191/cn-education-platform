import dotenv from 'dotenv'
dotenv.config()

import app from './app'

const PORT = parseInt(process.env.PORT || '3002', 10)

app.listen(PORT, () => {
  console.log(`🚀 Gateway corriendo en http://localhost:${PORT}`)
  console.log(`📋 Health:   http://localhost:${PORT}/health`)
  console.log(`🔀 Zona A → ${process.env.ZONA_A_URL}`)
  console.log(`🔀 Zona B → ${process.env.ZONA_B_URL}`)
})