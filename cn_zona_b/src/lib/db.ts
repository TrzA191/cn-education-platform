import mongoose from 'mongoose'

export const connectDb = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI!
  await mongoose.connect(uri)
  console.log('✅ Conectado a MongoDB (Zona B)')
}