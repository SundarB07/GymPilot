const generateWorkoutPlan = (userData) => {
    const { goal, level, days_per_week, time_per_session } = userData;

    let splitType = '';
    let schedule = {};

    if (days_per_week <= 3) {
        splitType = 'Full Body';
        schedule = generateFullBodySplit(days_per_week);
    } else if (days_per_week === 4) {
        splitType = 'Upper/Lower';
        schedule = generateUpperLowerSplit();
    } else {
        splitType = 'Push/Pull/Legs';
        schedule = generatePPLSplit(days_per_week);
    }

    return {
        splitType,
        schedule,
        description: `A ${days_per_week}-day ${splitType} routine focused on ${goal}.`,
    };
};

const generateFullBodySplit = (days) => {
    // simplified logic
    const daysMap = {
        1: 'Monday',
        2: 'Wednesday',
        3: 'Friday'
    };

    const schedule = {};
    for (let i = 1; i <= days; i++) {
        schedule[daysMap[i] || `Day ${i}`] = [
            { name: 'Squats', sets: 3, reps: '8-12' },
            { name: 'Bench Press', sets: 3, reps: '8-12' },
            { name: 'Bent Over Rows', sets: 3, reps: '8-12' },
            { name: 'Overhead Press', sets: 3, reps: '8-12' }
        ];
    }
    return schedule;
};

const generateUpperLowerSplit = () => {
    return {
        'Monday': [ // Upper
            { name: 'Bench Press', sets: 3, reps: '8-12' },
            { name: 'Rows', sets: 3, reps: '8-12' },
            { name: 'Overhead Press', sets: 3, reps: '10-15' }
        ],
        'Tuesday': [ // Lower
            { name: 'Squats', sets: 3, reps: '8-12' },
            { name: 'Romanian Deadlifts', sets: 3, reps: '8-12' },
            { name: 'Calf Raises', sets: 3, reps: '15-20' }
        ],
        'Thursday': [ // Upper
            { name: 'Incline Bench', sets: 3, reps: '8-12' },
            { name: 'Pullups', sets: 3, reps: 'AMRAP' },
            { name: 'Lateral Raises', sets: 3, reps: '12-15' }
        ],
        'Friday': [ // Lower
            { name: 'Deadlift', sets: 3, reps: '5-8' },
            { name: 'Leg Press', sets: 3, reps: '10-15' },
            { name: 'Leg Curls', sets: 3, reps: '12-15' }
        ]
    };
};

const generatePPLSplit = (days) => {
    // simplified PPL
    return {
        'Monday': [{ name: 'Push Day', notes: 'Chest, Shoulders, Triceps' }],
        'Tuesday': [{ name: 'Pull Day', notes: 'Back, Biceps' }],
        'Wednesday': [{ name: 'Legs Day', notes: 'Quads, Hams, Calves' }],
        'Thursday': [{ name: 'Push Day', notes: 'Focus on Shoulders' }],
        'Friday': [{ name: 'Pull Day', notes: 'Focus on Thickness' }],
        'Saturday': days === 6 ? [{ name: 'Legs Day', notes: 'Athletic focus' }] : []
    };
};

module.exports = { generateWorkoutPlan };
