const { WorkoutPlan, WorkoutLog } = require('../models');
const { generateWorkoutPlan } = require('../utils/workoutGenerator');
const { Op } = require('sequelize');

const createPlan = async (req, res) => {
    const { goal, level, days_per_week, time_per_session, customSchedule } = req.body;
    const userId = req.user.id;

    try {
        const generatedPlan = generateWorkoutPlan({
            goal,
            level,
            days_per_week,
            time_per_session,
            customSchedule
        });

        const workoutPlan = await WorkoutPlan.create({
            UserId: userId,
            goal,
            level,
            days_per_week,
            time_per_session,
            plan_data: generatedPlan,
        });

        res.status(201).json(workoutPlan);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error creating plan' });
    }
};

const getPlan = async (req, res) => {
    const userId = req.user.id;
    try {
        const plan = await WorkoutPlan.findOne({ where: { UserId: userId } });
        if (plan) {
            res.json(plan);
        } else {
            res.status(404).json({ message: 'No plan found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching plan' });
    }
};

const getTodayWorkout = async (req, res) => {
    const userId = req.user.id;
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    try {
        const plan = await WorkoutPlan.findOne({ where: { UserId: userId } });

        if (!plan) {
            return res.status(404).json({ message: 'No workout plan found. Please generate one.' });
        }

        const weeklySchedule = plan.plan_data.schedule;
        const dayData = weeklySchedule[today];

        console.log('DEBUG: Today is', today);
        console.log('DEBUG: Weekly Schedule Keys:', Object.keys(weeklySchedule));
        console.log('DEBUG: Day Data found:', !!dayData);

        // If undefined or check if object has exercises
        const todaysExercises = dayData?.exercises;

        if (!todaysExercises || todaysExercises.length === 0) {
            return res.json({
                day: today,
                isRestDay: true,
                message: 'Rest Day! Enjoy your recovery.',
                debug: {
                    today: today,
                    scheduleKeys: Object.keys(weeklySchedule),
                    dayDataFound: !!dayData
                }
            });
        }

        // Logic to adjust weights based on history (Progressive Overload)
        const tailoredExercises = await Promise.all(todaysExercises.map(async (ex) => {
            const lastLog = await WorkoutLog.findOne({
                where: {
                    UserId: userId,
                    exercise_name: ex.name
                },
                order: [['createdAt', 'DESC']]
            });

            let suggestedWeight = ex.weight || 20; // Default or from plan
            if (lastLog) {
                if (lastLog.completed) {
                    suggestedWeight = lastLog.weight + 2.5; // Increase
                } else {
                    suggestedWeight = lastLog.weight; // Maintain
                }
            }

            return { ...ex, suggestedWeight };
        }));

        res.json({ day: today, isRestDay: false, exercises: tailoredExercises });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching today workout' });
    }
};

const logWorkout = async (req, res) => {
    const userId = req.user.id;
    const { date, exercises } = req.body; // exercises: [{ name, sets, reps, weight, completed }]

    try {
        const logs = exercises.map(ex => {
            // Calculate summary stats if detailed logs are provided
            let maxWeight = ex.weight;
            let totalReps = ex.reps;

            if (ex.log_data && Array.isArray(ex.log_data) && ex.log_data.length > 0) {
                // Use max weight from sets for the main 'weight' column (progressive overload tracking)
                maxWeight = Math.max(...ex.log_data.map(s => parseFloat(s.weight) || 0));
                // Use total reps or just keep target? Let's use total for now or best set reps.
                // Actually, existing logic might rely on 'reps' as target or performed. 
                // Let's store the reps of the best set (highest weight) or just the first set for simplicity/compatibility.
                // We'll trust the frontend sent a valid summary 'weight' and 'reps' too, or derive it.
                // Let's derive maxWeight to be safe, reps can remain as passed (target or summary).
            }

            return {
                UserId: userId,
                date: date || new Date(),
                exercise_name: ex.name,
                sets: ex.sets,
                reps: ex.reps, // Keep summary/target reps
                weight: maxWeight, // Use max performed weight for tracking
                completed: ex.completed,
                log_data: ex.log_data // Save the detailed sets
            };
        });

        await WorkoutLog.bulkCreate(logs);
        res.status(201).json({ message: 'Workout logged successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error logging workout' });
    }
};

const previewPlan = async (req, res) => {
    // Just generate and return without saving
    const { goal, level, days_per_week, time_per_session, customSchedule } = req.body;
    try {
        const generatedPlan = generateWorkoutPlan({
            goal,
            level,
            days_per_week,
            time_per_session,
            customSchedule
        });
        res.json(generatedPlan);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error generating preview' });
    }
};

module.exports = { createPlan, getPlan, getTodayWorkout, logWorkout, previewPlan };
