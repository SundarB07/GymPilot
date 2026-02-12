import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { LogOut, Dumbbell, Utensils, TrendingUp, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = () => {
    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-slate-950/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
            <Link to="/dashboard" className="flex items-center gap-2 group">
                <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-2 rounded-lg shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300">
                    <Dumbbell className="text-white" size={24} />
                </div>
                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-200 to-cyan-400 tracking-tight">
                    GymPilot
                </span>
            </Link>

            <div className="flex gap-2 items-center bg-slate-900/50 p-1.5 rounded-xl border border-white/5">
                <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                <NavItem to="/today-workout" icon={Dumbbell} label="Workout" />
                <NavItem to="/diet-log" icon={Utensils} label="Diet" />
                <NavItem to="/progress" icon={TrendingUp} label="Progress" />
            </div>

            <button
                onClick={handleLogout}
                className="group flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-300"
            >
                <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Logout</span>
            </button>
        </nav>
    );
};

const NavItem = ({ to, icon: Icon, label }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link to={to} className="relative group">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 ${isActive ? 'text-cyan-400' : 'text-slate-400 hover:text-white'}`}>
                <Icon size={20} className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]' : ''}`} />
                <span className="hidden md:block font-medium">{label}</span>
            </div>
            {isActive && (
                <motion.div
                    layoutId="navbar-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                />
            )}
        </Link>
    );
};

export default Navbar;
