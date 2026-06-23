import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import GeneratePlan from './pages/GeneratePlan';
import MyPlan from './pages/MyPlan';
import TodayWorkout from './pages/TodayWorkout';
import DietLog from './pages/DietLog';
import GenerateDietPlan from './pages/GenerateDietPlan';
import MyDietPlan from './pages/MyDietPlan';
import PRHistory from './pages/PRHistory';
import WeightTracker from './pages/WeightTracker';
import WeeklyProgress from './pages/WeeklyProgress';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes wrapped in Layout */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/generate-plan" element={<GeneratePlan />} />
            <Route path="/plan" element={<MyPlan />} />
            <Route path="/workout" element={<TodayWorkout />} />
            <Route path="/diet-plan" element={<MyDietPlan />} />
            <Route path="/generate-diet" element={<GenerateDietPlan />} />
            <Route path="/diet" element={<DietLog />} />
            <Route path="/records" element={<PRHistory />} />
            <Route path="/weight" element={<WeightTracker />} />
            <Route path="/weekly-progress" element={<WeeklyProgress />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
