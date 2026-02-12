const express = require('express');
const router = express.Router();
const { logMeal, getDailyDiet, getProteinEstimate } = require('../controllers/dietController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, logMeal);
router.get('/', protect, getDailyDiet);
router.post('/estimate', protect, getProteinEstimate);

module.exports = router;
