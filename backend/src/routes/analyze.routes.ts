// routes/analyze.routes.ts
import { Router } from 'express';
import { analyzeTicket } from '../controllers/analyzeController.js';

const router = Router();
router.post('/analyze-ticket', analyzeTicket);

export default router;