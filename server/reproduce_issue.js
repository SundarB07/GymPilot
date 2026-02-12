const axios = require('axios');

async function testRegistration() {
    const uniqueId = Date.now();
    const user = {
        username: `testuser_${uniqueId}`,
        email: `testuser_${uniqueId}@example.com`,
        password: 'password123'
    };

    console.log('Attempting registration with:', user);

    try {
        const response = await axios.post('http://localhost:5000/api/auth/register', user);
        console.log('Status:', response.status);
        console.log('Response:', response.data);

        // Try registering again (should fail)
        console.log('\nAttempting duplicate registration...');
        try {
            await axios.post('http://localhost:5000/api/auth/register', user);
        } catch (error) {
            if (error.response) {
                console.log('Duplicate Registration Status:', error.response.status);
                console.log('Duplicate Registration Response:', error.response.data);
            } else {
                console.log('Error during duplicate registration:', error.message);
            }
        }
    } catch (error) {
        if (error.response) {
            console.log('Registration Failed Status:', error.response.status);
            console.log('Registration Failed Response:', error.response.data);
        } else {
            console.log('Error during registration:', error.message);
        }
    }
}

testRegistration();
