const { Router } = require('express');
const router = Router();

const {getDocenteInfo} = require('../controllers/docente.controller');

router.get('/get',getDocenteInfo);

module.exports = router;
