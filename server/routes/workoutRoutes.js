const express = require('express');
const router = express.Router();
const { createPlan, getPlan, getTodayWorkout, logWorkout, previewPlan } = require('../controllers/workoutController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createPlan);
router.get('/', protect, getPlan);
router.get('/today', protect, getTodayWorkout);
router.post('/log', protect, logWorkout);

router.post('/preview', protect, previewPlan);

module.exports = router;
