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
            <Route path="/diet" element={<DietLog />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
