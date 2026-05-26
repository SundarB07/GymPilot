import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './config/supabase.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Check Supabase connection health
app.get('/api/db-health', async (req, res) => {
  try {
    const { data, error } = await supabase.from('exercises').select('count', { count: 'exact', head: true });
    if (error) throw error;
    res.json({ status: 'connected', exerciseCount: data || 0 });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(` GymPilot Backend Server Running`);
  console.log(` Port: ${PORT}`);
  console.log(` URL:  http://localhost:${PORT}`);
  console.log(`========================================`);
});
