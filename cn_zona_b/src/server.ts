import dotenv from 'dotenv'
dotenv.config()

import app from './app'
import { connectDb } from './lib/db'

const PORT = parseInt(process.env.PORT || '3001', 10)

async function main() {
  try {
    await connectDb()

    app.listen(PORT, () => {
      console.log(`🚀 Zona B corriendo en http://localhost:${PORT}`)
      console.log(`📋 Health: http://localhost:${PORT}/health`)
      console.log(`🎬 Contents: http://localhost:${PORT}/api/contents`)
      console.log(`🏷️  Tags:     http://localhost:${PORT}/api/tags`)
      console.log(`🗺️  Paths:    http://localhost:${PORT}/api/paths`)
    })
  } catch (error) {
    console.error('❌ Error al iniciar:', error)
    process.exit(1)
  }
}

main()

process.on('SIGINT', async () => {
  console.log('\n🛑 Servidor detenido')
  process.exit(0)
})