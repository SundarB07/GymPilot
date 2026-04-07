import { Link } from 'react-router-dom';
import { Activity, CalendarPlus, ClipboardList, Utensils } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
    const { user, signOut } = useAuth();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold neon-text">GymPilot</h1>
                    <p className="text-sm text-gray-400">Welcome back, {user?.email}</p>
                </div>
                <button onClick={signOut} className="text-xs text-cyber-blue border border-cyber-blue/30 px-3 py-1 rounded hover:bg-cyber-blue/10 transition-colors">
                    Logout
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
                <Link to="/plan" className="cyber-card flex flex-col items-center justify-center p-6 space-y-3 cursor-pointer">
                    <ClipboardList className="text-cyber-cyan w-10 h-10 mb-2 drop-shadow-[0_0_10px_rgba(0,245,255,0.6)]" />
                    <span className="font-orbitron text-sm font-semibold tracking-wide">My Plan</span>
                </Link>

                <Link to="/generate-plan" className="cyber-card flex flex-col items-center justify-center p-6 space-y-3 cursor-pointer border-t-2 border-t-cyber-blue">
                    <CalendarPlus className="text-cyber-blue w-10 h-10 mb-2 drop-shadow-[0_0_10px_rgba(0,204,255,0.6)]" />
                    <span className="font-orbitron text-sm font-semibold tracking-wide">Generate Plan</span>
                </Link>

                <Link to="/workout" className="cyber-card flex flex-col items-center justify-center p-6 space-y-3 cursor-pointer">
                    <Activity className="text-cyber-pink w-10 h-10 mb-2 drop-shadow-[0_0_10px_rgba(254,83,187,0.6)]" />
                    <span className="font-orbitron text-sm font-semibold tracking-wide">Today's Workout</span>
                </Link>

                <Link to="/diet" className="cyber-card flex flex-col items-center justify-center p-6 space-y-3 cursor-pointer">
                    <Utensils className="text-purple-400 w-10 h-10 mb-2 drop-shadow-[0_0_10px_rgba(183,108,253,0.6)]" />
                    <span className="font-orbitron text-sm font-semibold tracking-wide">Diet Log</span>
                </Link>
            </div>

            <div className="mt-8 cyber-card p-4 border border-cyber-cyan/20">
                <h3 className="font-orbitron text- cyber-cyan mb-2">Protocol Status</h3>
                <p className="text-sm text-gray-400">Your currently active routine will be displayed here.</p>
            </div>
        </div>
    );
}
