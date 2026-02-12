const { generateWorkoutPlan } = require('./utils/workoutGenerator');

function testGenerator() {
    const customSchedule = {
        'Day 1': 'Chest',
        'Day 2': 'Legs',
        'Day 3': 'Rest'
    };

    const userData = {
        goal: 'Muscle Gain',
        level: 'Intermediate',
        days_per_week: 3,
        time_per_session: 60,
        customSchedule: customSchedule
    };

    console.log('Testing Generator Logic with:', userData);

    const result = generateWorkoutPlan(userData);

    console.log('Split Type:', result.splitType);
    console.log('Schedule Keys:', Object.keys(result.schedule));

    const day1 = result.schedule['Day 1'];
    console.log('Day 1 Focus:', day1?.focus);
    console.log('Day 1 Exercises:', day1?.exercises?.length);

    if (result.splitType === 'Custom Split' && day1?.focus === 'Chest' && day1?.exercises?.length > 0) {
        console.log('SUCCESS: Custom split generated correctly.');
    } else {
        console.log('FAILURE: Generator logic failed.');
    }
}

testGenerator();
