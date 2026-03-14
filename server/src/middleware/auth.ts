import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

export type SessionClaims = {
  sub: string
  email: string
  name: string
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: SessionClaims
  }
}

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET
  if (secret) return secret
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is not set')
  }
  return 'dev-jwt-secret'
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.header('authorization') || ''
  const [, token] = header.split(' ')
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    const claims = jwt.verify(token, getJwtSecret()) as SessionClaims
    req.user = claims
    next()
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
  }
}

export const getJwtSecretForSigning = getJwtSecret

