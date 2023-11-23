const { Router } = require('express');
const router = Router();

const { getReviews, createReview , getDocenteWithReview} = require('../controllers/review.controller.js');

router.get('/get', getReviews);
router.post('/create',createReview);
router.get('/search',getDocenteWithReview);


module.exports = router;