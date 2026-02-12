const axios = require('axios');

async function testCustomPlan() {
    const customSchedule = {
        'Day 1': 'Chest',
        'Day 2': 'Back',
        'Day 3': 'Rest'
    };

    const payload = {
        goal: 'Muscle Gain',
        level: 'Intermediate',
        days_per_week: 3,
        time_per_session: 60,
        customSchedule: customSchedule
    };

    console.log('Testing Custom Plan Generation with payload:', payload);

    try {
        const response = await axios.post('http://localhost:5000/api/workouts/preview', payload);
        console.log('Status:', response.status);
        console.log('Response Split Type:', response.data.splitType);
        console.log('Response Schedule Keys:', Object.keys(response.data.schedule));

        const day1 = response.data.schedule['Day 1'];
        console.log('Day 1 Focus:', day1.focus);
        console.log('Day 1 Exercises Count:', day1.exercises.length);

        if (day1.focus === 'Chest' && day1.exercises.length > 0) {
            console.log('SUCCESS: Day 1 identified as Chest with exercises.');
        } else {
            console.log('FAILURE: Day 1 mismatch.');
        }

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Data:', error.response.data);
        }
    }
}

testCustomPlan();
