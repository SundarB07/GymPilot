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

const getProteinEstimate = async (req, res) => {
    const { item_name } = req.body;
    if (!item_name) return res.status(400).json({ message: 'Item name required' });

    const lowerItem = item_name.toLowerCase();

    // Simple Keyword Database (Per 1 serving/unit roughly)
    const foodDatabase = [
        { keywords: ['chicken', 'breast'], protein: 31 },
        { keywords: ['egg'], protein: 6 },
        { keywords: ['beef', 'steak'], protein: 26 },
        { keywords: ['salmon', 'fish'], protein: 20 },
        { keywords: ['tuna'], protein: 25 },
        { keywords: ['yogurt', 'greek'], protein: 10 },
        { keywords: ['milk'], protein: 8 },
        { keywords: ['protein', 'shake', 'whey'], protein: 24 },
        { keywords: ['tofu'], protein: 8 },
        { keywords: ['lentils', 'dal'], protein: 9 },
        { keywords: ['rice'], protein: 3 },
        { keywords: ['oats', 'oatmeal'], protein: 5 },
        { keywords: ['almonds', 'nuts'], protein: 6 },
        { keywords: ['cheese'], protein: 7 },
        { keywords: ['paneer'], protein: 18 },
    ];

    let estimatedProtein = 0;

    // Find first match
    const match = foodDatabase.find(food =>
        food.keywords.some(k => lowerItem.includes(k))
    );

    if (match) {
        estimatedProtein = match.protein;
    } else {
        // Fallback heuristics
        if (lowerItem.includes('meat')) estimatedProtein = 20;
        else if (lowerItem.includes('bean')) estimatedProtein = 7;
    }

    // Heuristic for quantity (very basic)
    // If user says "2 eggs", multiply by 2
    const numberMatch = lowerItem.match(/(\d+)/);
    if (numberMatch && match) {
        const qty = parseInt(numberMatch[0]);
        if (qty > 0 && qty < 10) { // Safety cap
            estimatedProtein *= qty;
        }
    }

    res.json({ estimatedProtein });
};

module.exports = { logMeal, getDailyDiet, getProteinEstimate };
