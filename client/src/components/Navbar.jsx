import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { LogOut, Dumbbell, Utensils, TrendingUp, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-surface border-b border-gray-700 px-6 py-4 flex justify-between items-center shadow-lg">
            <Link to="/dashboard" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                GymPilot
            </Link>

            <div className="flex gap-6 items-center">
                <Link to="/dashboard" className="text-gray-300 hover:text-primary transition-colors flex items-center gap-2">
                    <LayoutDashboard size={20} />
                    <span className="hidden md:block">Dashboard</span>
                </Link>
                <Link to="/today-workout" className="text-gray-300 hover:text-primary transition-colors flex items-center gap-2">
                    <Dumbbell size={20} />
                    <span className="hidden md:block">Workout</span>
                </Link>
                <Link to="/diet-log" className="text-gray-300 hover:text-primary transition-colors flex items-center gap-2">
                    <Utensils size={20} />
                    <span className="hidden md:block">Diet</span>
                </Link>
                <Link to="/progress" className="text-gray-300 hover:text-primary transition-colors flex items-center gap-2">
                    <TrendingUp size={20} />
                    <span className="hidden md:block">Progress</span>
                </Link>

                <button
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
                >
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
