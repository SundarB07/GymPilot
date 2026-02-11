const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api';
let token = '';

const runTest = async () => {
    try {
        console.log('--- Starting System Verification ---');

        // 1. Register User
        const uniqueUser = `test_${Date.now()}`;
        console.log(`\n1. Registering user: ${uniqueUser}`);
        const regRes = await axios.post(`${BASE_URL}/auth/register`, {
            username: uniqueUser,
            email: `${uniqueUser}@example.com`,
            password: 'password123'
        });
        console.log('   ✅ Registration Successful');
        token = regRes.data.token;

        // 2. Generate Workout Plan
        console.log('\n2. Generating Workout Plan');
        const planRes = await axios.post(`${BASE_URL}/workouts`, {
            age: 25,
            height: 180,
            weight: 80,
            goal: 'Muscle Gain',
            level: 'Intermediate',
            days_per_week: 4,
            time_per_session: 60
        }, { headers: { Authorization: `Bearer ${token}` } });
        console.log('   ✅ Plan Generated:', planRes.data.description);

        // 3. Get Today's Workout
        console.log("\n3. Fetching Today's Workout");
        const todayRes = await axios.get(`${BASE_URL}/workouts/today`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   ✅ Today is:', todayRes.data.day);
        if (todayRes.data.exercises) {
            console.log('   ✅ Exercises found:', todayRes.data.exercises.length);
        } else {
            console.log('   ℹ️ Rest Day');
        }

        // 4. Log Diet
        console.log('\n4. Logging Diet');
        await axios.post(`${BASE_URL}/diet`, {
            meal_type: 'Breakfast',
            item_name: 'Oatmeal & Eggs',
            protein: 25
        }, { headers: { Authorization: `Bearer ${token}` } });
        console.log('   ✅ Meal Logged');

        const dietRes = await axios.get(`${BASE_URL}/diet`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('   ✅ Total Protein Today:', dietRes.data.totalProtein);

        // 5. Upload Progress Image (Mock)
        console.log('\n5. Uploading Progress Image');

        // Create a dummy image file
        const dummyPath = path.join(__dirname, 'test_image.jpg');
        fs.writeFileSync(dummyPath, 'fake image content');

        const form = new FormData();
        form.append('image', fs.createReadStream(dummyPath));
        form.append('weight', '80');

        const uploadRes = await axios.post(`${BASE_URL}/progress`, form, {
            headers: {
                Authorization: `Bearer ${token}`,
                ...form.getHeaders()
            }
        });
        console.log('   ✅ Image Uploaded, URL:', uploadRes.data.image_url);

        // Cleanup
        fs.unlinkSync(dummyPath);
        console.log('\n--- Verification Complete: ALL TESTS PASSED ---');

    } catch (error) {
        console.error('\n❌ TEST FAILED');
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        } else {
            console.error('   Error:', error.message);
        }
        process.exit(1);
    }
};

runTest();
