const { Router } = require('express');
const router = Router();

const { getEstudiantes, createEstudiante, getEstudianteBySession, getReviewsByCodigo } = require('../controllers/index.controller.js');

router.get('/get', getEstudiantes);
router.post('/get',getEstudianteBySession);
router.post('/create',createEstudiante)


module.exports = router;