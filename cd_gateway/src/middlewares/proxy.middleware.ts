import { Request, Response } from 'express'
import axios, { AxiosRequestConfig, Method } from 'axios'

export const proxy = (baseUrl: string) => {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const url = `${baseUrl}${req.originalUrl}`

      const config: AxiosRequestConfig = {
        method: req.method as Method,
        url,
        headers: {
          // Solo pasar estos headers, ignorar el resto para evitar conflictos
          'content-type': req.headers['content-type'],
          'authorization': req.headers['authorization'],
          'accept': req.headers['accept'],
        },
        data: req.body,
        params: req.query,
        validateStatus: () => true,
      }

      const response = await axios(config)
      res.status(response.status).json(response.data)

    } catch (error: any) {
      console.error('[proxy error]', error.message)
      res.status(502).json({ error: 'Servicio no disponible' })
    }
  }
}