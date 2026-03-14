export interface JwtPayload {
  userId: number
  email: string
  role: string
  iat?: number
  exp?: number
}