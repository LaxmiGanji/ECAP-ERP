const express = require('express');
const router = express.Router();
const coattainmentController = require('../../controllers/Other/coattainment.controller');

router.post('/calculate-coattainment', coattainmentController.calculateCoattainment);
router.get('/attainments/:subjectId', coattainmentController.getAttainments);

module.exports = router;
