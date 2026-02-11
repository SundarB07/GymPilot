const { DietLog } = require('../models');
const { Op } = require('sequelize');

const logMeal = async (req, res) => {
    const userId = req.user.id;
    const { date, meal_type, item_name, protein } = req.body;

    try {
        const dietLog = await DietLog.create({
            UserId: userId,
            date: date || new Date(),
            meal_type,
            item_name,
            protein,
        });

        res.status(201).json(dietLog);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error logging meal' });
    }
};

const getDailyDiet = async (req, res) => {
    const userId = req.user.id;
    const { date } = req.query; // Expect YYYY-MM-DD string or use current date

    try {
        const targetDate = date ? new Date(date) : new Date();
        // Sequelize DATEONLY comparison can be tricky, depending on timezone. 
        // Using string comparison if stored as DATEONLY might be safer or range.

        const logs = await DietLog.findAll({
            where: {
                UserId: userId,
                date: targetDate,
            },
        });

        const totalProtein = logs.reduce((acc, curr) => acc + curr.protein, 0);

        res.json({
            date: targetDate,
            logs,
            totalProtein
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching diet logs' });
    }
};

module.exports = { logMeal, getDailyDiet };
