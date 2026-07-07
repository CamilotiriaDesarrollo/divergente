import { Request, Response } from 'express'
import sistemas from '../config/sistemas.json'

export function getSistemas(_req: Request, res: Response) {
  res.json(sistemas)
}
