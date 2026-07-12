import express from 'express';
import { gerarRelatorio } from '../controllers/pdfController.js';
import authenticate from '../middlewares/authenticate.js';

const router = express.Router();

// Rota para exportar PDF do paciente
router.get("/export/pdf/:id", authenticate, gerarRelatorio);
export default router;