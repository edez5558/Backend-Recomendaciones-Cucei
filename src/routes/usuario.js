const { Router } = require('express');
const router = Router();

const { createSession , verifySession, createEstudiante} = require('../controllers/usuario.controller.js');

router.post('/verify',verifySession);
router.post('/login',createSession);
router.post('/create',createEstudiante);

module.exports = router;