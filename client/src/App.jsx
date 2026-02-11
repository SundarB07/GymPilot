import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useContext } from 'react';
import AuthContext from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import WorkoutGenerator from './pages/WorkoutGenerator';
import TodayWorkout from './pages/TodayWorkout';
import DietLog from './pages/DietLog';
import Progress from './pages/Progress';
import Landing from './pages/Landing';
import LoadingSpinner from './components/LoadingSpinner';

const AppRoutes = () => {
  const { loading, user } = useContext(AuthContext);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />

      <Route path="/generate-plan" element={
        <ProtectedRoute>
          <WorkoutGenerator />
        </ProtectedRoute>
      } />

      <Route path="/today-workout" element={
        <ProtectedRoute>
          <TodayWorkout />
        </ProtectedRoute>
      } />

      <Route path="/diet-log" element={
        <ProtectedRoute>
          <DietLog />
        </ProtectedRoute>
      } />

      <Route path="/progress" element={
        <ProtectedRoute>
          <Progress />
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;

