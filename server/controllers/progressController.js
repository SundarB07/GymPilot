const { ProgressImage } = require('../models');
const multer = require('multer');
const path = require('path');

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5000000 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: Images Only!');
        }
    },
});

const uploadImage = async (req, res) => {
    const userId = req.user.id;
    const { weight, date } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: 'Please upload an image' });
    }

    try {
        const progress = await ProgressImage.create({
            UserId: userId,
            date: date || new Date(),
            image_url: `/uploads/${req.file.filename}`,
            weight,
        });

        res.status(201).json(progress);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error uploading image' });
    }
};

const getProgress = async (req, res) => {
    const userId = req.user.id;
    try {
        const progress = await ProgressImage.findAll({
            where: { UserId: userId },
            order: [['date', 'ASC']],
        });
        res.json(progress);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching progress' });
    }
};

const fs = require('fs');

const deleteProgress = async (req, res) => {
    const userId = req.user.id;
    const progressId = req.params.id;

    try {
        const progress = await ProgressImage.findOne({ where: { id: progressId, UserId: userId } });

        if (!progress) {
            return res.status(404).json({ message: 'Progress record not found' });
        }

        // Delete file from filesystem
        const filePath = path.join(__dirname, '..', progress.image_url);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete from database
        await progress.destroy();

        res.json({ message: 'Progress deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error deleting progress' });
    }
};

module.exports = { upload, uploadImage, getProgress, deleteProgress };
