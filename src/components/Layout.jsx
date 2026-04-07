import { Outlet, NavLink } from 'react-router-dom';
import { Home, ClipboardList, Dumbbell, Apple } from 'lucide-react';

export default function Layout() {
    return (
        <div className="min-h-screen flex flex-col items-center">
            {/* Main Content Area */}
            <main className="w-full max-w-md flex-1 p-4 mb-20 md:mb-0">
                <Outlet />
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 z-50 w-full bg-[#0a0a0f] border-t border-cyber-blue/30 shadow-[0_-5px_20px_rgba(0,204,255,0.15)] md:max-w-md backdrop-blur-xl bg-opacity-90">
                <div className="flex justify-around items-center h-16">
                    <NavLink to="/" className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${isActive ? 'text-cyber-cyan neon-text scale-110' : 'text-gray-500 hover:text-cyber-blue'}`}>
                        <Home size={22} className={({ isActive }) => isActive ? "drop-shadow-[0_0_8px_rgba(0,245,255,0.8)]" : ""} />
                        <span className="text-[10px] uppercase font-orbitron mt-1 tracking-wider">Dashboard</span>
                    </NavLink>
                    <NavLink to="/plan" className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${isActive ? 'text-cyber-cyan neon-text scale-110' : 'text-gray-500 hover:text-cyber-blue'}`}>
                        <ClipboardList size={22} className={({ isActive }) => isActive ? "drop-shadow-[0_0_8px_rgba(0,245,255,0.8)]" : ""} />
                        <span className="text-[10px] uppercase font-orbitron mt-1 tracking-wider">Plan</span>
                    </NavLink>
                    <NavLink to="/workout" className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${isActive ? 'text-cyber-cyan neon-text scale-110' : 'text-gray-500 hover:text-cyber-blue'}`}>
                        <Dumbbell size={22} className={({ isActive }) => isActive ? "drop-shadow-[0_0_8px_rgba(0,245,255,0.8)]" : ""} />
                        <span className="text-[10px] uppercase font-orbitron mt-1 tracking-wider">Workout</span>
                    </NavLink>
                    <NavLink to="/diet" className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${isActive ? 'text-cyber-cyan neon-text scale-110' : 'text-gray-500 hover:text-cyber-blue'}`}>
                        <Apple size={22} className={({ isActive }) => isActive ? "drop-shadow-[0_0_8px_rgba(0,245,255,0.8)]" : ""} />
                        <span className="text-[10px] uppercase font-orbitron mt-1 tracking-wider">Diet</span>
                    </NavLink>
                </div>
            </nav>
        </div>
    );
}
