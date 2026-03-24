// src/lib/zonaA.ts
import axios from 'axios'

const zonaA = axios.create({
  baseURL: process.env.ZONA_A_URL,  // ej: http://localhost:3001
  headers: {
    'Content-Type': 'application/json',
    'x-internal-key': process.env.INTERNAL_API_KEY  // clave entre microservicios
  }
})

export default zonaA