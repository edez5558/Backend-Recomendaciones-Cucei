const { Router } = require('express');
const router = Router();

const { createReview , getDocenteWithReview, reportReview, setCancelReport, deleteReviews} = require('../controllers/review.controller.js');

router.post('/create',createReview);
router.get('/search',getDocenteWithReview);
router.post('/report',reportReview);
router.post('/report/cancel',setCancelReport);
router.post('/delete',deleteReviews);

module.exports = router;