const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db');

dotenv.config();
// Force restart for debug

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Test Route
app.get('/', (req, res) => {
  res.send('GymPilot API is running...');
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/workouts', require('./routes/workoutRoutes'));
app.use('/api/diet', require('./routes/dietRoutes'));
app.use('/api/progress', require('./routes/progressRoutes'));

// Database Connection
db.authenticate()
  .then(() => {
    console.log('Database connected...');
    return db.sync({ alter: true }); // Sync models
  })
  .then(() => console.log('Models synced...'))
  .catch(err => console.log('Error: ' + err));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
