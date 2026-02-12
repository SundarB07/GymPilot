const generateWorkoutPlan = (userData) => {
    let { goal, level, days_per_week, time_per_session, customSchedule } = userData;
    days_per_week = parseInt(days_per_week);

    let splitType = '';
    let schedule = {};

    if (customSchedule) {
        splitType = 'Custom Split';
        schedule = generateCustomSplit(customSchedule);
    } else {
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
    }

    return {
        splitType,
        schedule,
        description: `A ${days_per_week}-day ${splitType} routine focused on ${goal}.`,
    };
};

const generateCustomSplit = (customSchedule) => {
    const schedule = {};
    // customSchedule is object: { "Day 1": "Chest", "Day 2": "Legs", ... }

    const dayMapping = {
        'Day 1': 'Monday',
        'Day 2': 'Tuesday',
        'Day 3': 'Wednesday',
        'Day 4': 'Thursday',
        'Day 5': 'Friday',
        'Day 6': 'Saturday',
        'Day 7': 'Sunday'
    };

    Object.entries(customSchedule).forEach(([day, focus]) => {
        // Use mapped weekday if available, otherwise keep original key (e.g. if already "Monday")
        const mappedDay = dayMapping[day] || day;

        if (focus === 'Rest') {
            schedule[mappedDay] = { focus: 'Rest Day', exercises: [] };
        } else {
            schedule[mappedDay] = {
                focus: focus,
                exercises: getExercisesForFocus(focus)
            };
        }
    });

    return schedule;
};

const getExercisesForFocus = (focus) => {
    // Basic mapping of focus to exercises. 
    // In a real app, this could be more sophisticated or queried from DB.
    const exerciseDatabase = {
        'Chest': [
            { name: 'Bench Press', sets: 4, reps: '8-10', weight: 40 },
            { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', weight: 20 },
            { name: 'Chest Flyes', sets: 3, reps: '12-15', weight: 12 },
            { name: 'Push Ups', sets: 3, reps: 'AMRAP', weight: 0 }
        ],
        'Back': [
            { name: 'Deadlift', sets: 3, reps: '6-8', weight: 60 },
            { name: 'Pull Ups', sets: 3, reps: 'AMRAP', weight: 0 },
            { name: 'Bent Over Rows', sets: 4, reps: '8-10', weight: 40 },
            { name: 'Lat Pulldowns', sets: 3, reps: '10-12', weight: 35 }
        ],
        'Legs': [
            { name: 'Squats', sets: 4, reps: '6-8', weight: 60 },
            { name: 'Leg Press', sets: 3, reps: '10-12', weight: 100 },
            { name: 'Romanian Deadlifts', sets: 3, reps: '8-10', weight: 50 },
            { name: 'Calf Raises', sets: 4, reps: '15-20', weight: 40 }
        ],
        'Shoulders': [
            { name: 'Overhead Press', sets: 4, reps: '8-10', weight: 30 },
            { name: 'Lateral Raises', sets: 3, reps: '12-15', weight: 10 },
            { name: 'Front Raises', sets: 3, reps: '12-15', weight: 10 },
            { name: 'Face Pulls', sets: 3, reps: '15-20', weight: 20 }
        ],
        'Arms': [
            { name: 'Barbell Curls', sets: 3, reps: '10-12', weight: 20 },
            { name: 'Tricep Dips', sets: 3, reps: '10-12', weight: 0 },
            { name: 'Hammer Curls', sets: 3, reps: '12-15', weight: 15 },
            { name: 'Skullcrushers', sets: 3, reps: '10-12', weight: 20 }
        ],
        'Cardio': [
            { name: 'Running / Treadmill', sets: 1, reps: '30 mins', weight: 0 },
            { name: 'Cycling', sets: 1, reps: '20 mins', weight: 0 }
        ],
        'Abs/Core': [
            { name: 'Planks', sets: 3, reps: '60s', weight: 0 },
            { name: 'Crunches', sets: 3, reps: '15-20', weight: 0 },
            { name: 'Leg Raises', sets: 3, reps: '15-20', weight: 0 }
        ]
    };

    // Fallback/Aliases
    if (focus === 'Push') return [
        ...exerciseDatabase['Chest'].slice(0, 2),
        ...exerciseDatabase['Shoulders'].slice(0, 2),
        ...exerciseDatabase['Arms'].slice(1, 2)
    ];
    if (focus === 'Pull') return [
        ...exerciseDatabase['Back'].slice(0, 3),
        ...exerciseDatabase['Arms'].slice(0, 2)
    ];
    if (focus === 'Upper Body') return [
        ...exerciseDatabase['Chest'].slice(0, 1),
        ...exerciseDatabase['Back'].slice(0, 1),
        ...exerciseDatabase['Shoulders'].slice(0, 1),
        ...exerciseDatabase['Arms'].slice(0, 2)
    ];
    if (focus === 'Lower Body') return exerciseDatabase['Legs'];
    if (focus === 'Full Body') return generateFullBodySplit(1)['Day 1'].exercises;

    return exerciseDatabase[focus] || [];
};

/* 
  Updated to return object structure:
  { focus: 'Muscle Group / Day Type', exercises: [...] }
*/

const generateFullBodySplit = (days) => {
    // Detailed Full Body Routine
    const daysMap = {
        1: 'Monday',
        2: 'Wednesday',
        3: 'Friday',
        4: 'Saturday',
        5: 'Sunday',
        6: 'Tuesday', // Fallback
        7: 'Thursday' // Fallback
    };

    const schedule = {};
    for (let i = 1; i <= days; i++) {
        // Alternate A/B logic could be added here, keeping it simple but detailed for now
        schedule[daysMap[i] || `Day ${i}`] = {
            focus: 'Full Body',
            exercises: [
                { name: 'Barbell Squats', sets: 3, reps: '8-10', weight: 40 },
                { name: 'Bench Press', sets: 3, reps: '8-12', weight: 30 },
                { name: 'Bent Over Rows', sets: 3, reps: '8-12', weight: 30 },
                { name: 'Overhead Press', sets: 3, reps: '10-12', weight: 20 },
                { name: 'Dumbbell Lunges', sets: 3, reps: '12-15', weight: 15 },
                { name: 'Planks', sets: 3, reps: '60s', weight: 0 }
            ]
        };
    }
    return schedule;
};

const generateUpperLowerSplit = () => {
    return {
        'Monday': {
            focus: 'Upper Body Power',
            exercises: [
                { name: 'Bench Press', sets: 4, reps: '6-8', weight: 40 },
                { name: 'Bent Over Rows', sets: 4, reps: '6-8', weight: 40 },
                { name: 'Overhead Press', sets: 3, reps: '8-10', weight: 25 },
                { name: 'Pull Ups', sets: 3, reps: 'AMRAP', weight: 0 },
                { name: 'Skullcrushers', sets: 3, reps: '10-12', weight: 15 },
                { name: 'Barbell Curls', sets: 3, reps: '10-12', weight: 15 }
            ]
        },
        'Tuesday': {
            focus: 'Lower Body Power',
            exercises: [
                { name: 'Squats', sets: 4, reps: '6-8', weight: 50 },
                { name: 'Romanian Deadlifts', sets: 4, reps: '8-10', weight: 50 },
                { name: 'Leg Press', sets: 3, reps: '10-12', weight: 80 },
                { name: 'Leg Curls', sets: 3, reps: '12-15', weight: 20 },
                { name: 'Calf Raises', sets: 4, reps: '15-20', weight: 40 }
            ]
        },
        'Thursday': {
            focus: 'Upper Body Hypertrophy',
            exercises: [
                { name: 'Incline Dumbbell Press', sets: 3, reps: '8-12', weight: 20 },
                { name: 'Seated Cable Rows', sets: 3, reps: '10-12', weight: 40 },
                { name: 'Lateral Raises', sets: 3, reps: '12-15', weight: 8 },
                { name: 'Face Pulls', sets: 3, reps: '15-20', weight: 15 },
                { name: 'Tricep Pushdowns', sets: 3, reps: '12-15', weight: 15 },
                { name: 'Hammer Curls', sets: 3, reps: '12-15', weight: 10 }
            ]
        },
        'Friday': {
            focus: 'Lower Body Hypertrophy',
            exercises: [
                { name: 'Deadlift', sets: 3, reps: '6-8', weight: 60 },
                { name: 'Walking Lunges', sets: 3, reps: '10-12', weight: 15 },
                { name: 'Leg Extensions', sets: 3, reps: '12-15', weight: 30 },
                { name: 'Seated Leg Curls', sets: 3, reps: '12-15', weight: 30 },
                { name: 'Calf Raises', sets: 3, reps: '15-20', weight: 40 },
                { name: 'Hanging Leg Raises', sets: 3, reps: '10-15', weight: 0 }
            ]
        }
    };
};

const generatePPLSplit = (days) => {
    const pushWorkout = {
        focus: 'Push (Chest, Shoulders, Triceps)',
        exercises: [
            { name: 'Bench Press', sets: 4, reps: '6-8', weight: 40 },
            { name: 'Overhead Press', sets: 3, reps: '8-10', weight: 25 },
            { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', weight: 20 },
            { name: 'Lateral Raises', sets: 3, reps: '12-15', weight: 8 },
            { name: 'Tricep Pushdowns', sets: 3, reps: '12-15', weight: 15 }
        ]
    };

    const pullWorkout = {
        focus: 'Pull (Back, Biceps)',
        exercises: [
            { name: 'Deadlift', sets: 3, reps: '5', weight: 60 },
            { name: 'Pull Ups', sets: 3, reps: 'AMRAP', weight: 0 },
            { name: 'Barbell Rows', sets: 3, reps: '8-10', weight: 40 },
            { name: 'Face Pulls', sets: 3, reps: '15-20', weight: 15 },
            { name: 'Barbell Curls', sets: 3, reps: '10-12', weight: 20 }
        ]
    };

    const legsWorkout = {
        focus: 'Legs (Quads, Hamstrings, Calves)',
        exercises: [
            { name: 'Squats', sets: 4, reps: '6-8', weight: 50 },
            { name: 'Romanian Deadlifts', sets: 3, reps: '8-10', weight: 50 },
            { name: 'Leg Press', sets: 3, reps: '10-12', weight: 80 },
            { name: 'Leg Curls', sets: 3, reps: '12-15', weight: 30 },
            { name: 'Calf Raises', sets: 4, reps: '15-20', weight: 40 }
        ]
    };

    const schedule = {
        'Monday': pushWorkout,
        'Tuesday': pullWorkout,
        'Wednesday': legsWorkout
    };

    if (days >= 4) schedule['Thursday'] = pushWorkout;
    if (days >= 5) schedule['Friday'] = pullWorkout;
    if (days === 6) schedule['Saturday'] = legsWorkout;

    return schedule;
};

module.exports = { generateWorkoutPlan };
