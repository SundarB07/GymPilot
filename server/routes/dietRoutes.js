const express = require('express');
const router = express.Router();
const { logMeal, getDailyDiet } = require('../controllers/dietController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, logMeal);
router.get('/', protect, getDailyDiet);

module.exports = router;
