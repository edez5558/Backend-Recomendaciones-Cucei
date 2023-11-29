const { Router } = require('express');
const router = Router();

const { createSession , verifySession, createEstudiante, updatePasswordFormat} = require('../controllers/usuario.controller.js');

router.post('/verify',verifySession);
router.post('/login',createSession);
router.post('/create',createEstudiante);
router.get('/password/update',updatePasswordFormat);

module.exports = router;