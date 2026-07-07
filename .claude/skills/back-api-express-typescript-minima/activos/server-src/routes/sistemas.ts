import { Router } from 'express'
import { getSistemas } from '../controllers/sistemasController'

const router = Router()

router.get('/', getSistemas)

export default router
