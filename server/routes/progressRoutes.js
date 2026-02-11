const express = require('express');
const router = express.Router();
const { upload, uploadImage, getProgress } = require('../controllers/progressController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, upload.single('image'), uploadImage);
router.get('/', protect, getProgress);

module.exports = router;
