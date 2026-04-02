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
          'content-type': req.headers['content-type'],
          'authorization': req.headers['authorization'],
          'accept': req.headers['accept'],
          'x-forwarded-for': req.ip || req.headers['x-forwarded-for'],
          'x-forwarded-user-agent': req.headers['user-agent'],
          'x-captcha-verified': req.headers['x-captcha-verified'], // ← agregar
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