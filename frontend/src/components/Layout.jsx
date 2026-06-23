import { Outlet, NavLink } from 'react-router-dom';
import { Home, ClipboardList, Dumbbell, Apple, LogOut, Sparkles, Trophy, Scale, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
    const { signOut, user, displayName } = useAuth();

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-cyber-bg text-gray-300">
            {/* Desktop Left Sidebar (Visible on Laptop/Desktop, Hidden on Mobile) */}
            <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-[#07070c] border-r border-cyber-blue/10 p-6 z-40 justify-between">
                <div className="space-y-8">
                    {/* Brand / Logo */}
                    <div className="flex items-center space-x-3 py-2 border-b border-cyber-blue/15">
                        <Dumbbell className="text-cyber-cyan w-8 h-8 drop-shadow-[0_0_10px_rgba(0,245,255,0.8)] animate-pulse" />
                        <span className="font-orbitron font-extrabold text-xl tracking-wider text-white uppercase bg-clip-text bg-gradient-to-r from-white to-cyber-cyan">GymPilot</span>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex flex-col space-y-2">
                        <NavLink to="/" className={({ isActive }) => `flex items-center space-x-4 px-4 py-3 rounded-lg font-orbitron text-sm font-semibold tracking-wide transition-all duration-300 ${isActive ? 'bg-cyber-blue/10 text-cyber-cyan border-l-2 border-cyber-cyan shadow-[0_0_15px_rgba(0,204,255,0.15)]' : 'text-gray-400 hover:bg-cyber-blue/5 hover:text-white'}`}>
                            <Home size={18} />
                            <span>Dashboard</span>
                        </NavLink>
                        <NavLink to="/plan" className={({ isActive }) => `flex items-center space-x-4 px-4 py-3 rounded-lg font-orbitron text-sm font-semibold tracking-wide transition-all duration-300 ${isActive ? 'bg-cyber-blue/10 text-cyber-cyan border-l-2 border-cyber-cyan shadow-[0_0_15px_rgba(0,204,255,0.15)]' : 'text-gray-400 hover:bg-cyber-blue/5 hover:text-white'}`}>
                            <ClipboardList size={18} />
                            <span>Workout Plan</span>
                        </NavLink>
                        <NavLink to="/workout" className={({ isActive }) => `flex items-center space-x-4 px-4 py-3 rounded-lg font-orbitron text-sm font-semibold tracking-wide transition-all duration-300 ${isActive ? 'bg-cyber-blue/10 text-cyber-cyan border-l-2 border-cyber-cyan shadow-[0_0_15px_rgba(0,204,255,0.15)]' : 'text-gray-400 hover:bg-cyber-blue/5 hover:text-white'}`}>
                            <Dumbbell size={18} />
                            <span>Workout</span>
                        </NavLink>
                        <NavLink to="/diet-plan" className={({ isActive }) => `flex items-center space-x-4 px-4 py-3 rounded-lg font-orbitron text-sm font-semibold tracking-wide transition-all duration-300 ${isActive ? 'bg-cyber-blue/10 text-cyber-cyan border-l-2 border-cyber-cyan shadow-[0_0_15px_rgba(0,204,255,0.15)]' : 'text-gray-400 hover:bg-cyber-blue/5 hover:text-white'}`}>
                            <Sparkles size={18} />
                            <span>Diet Plan</span>
                        </NavLink>
                        <NavLink to="/diet" className={({ isActive }) => `flex items-center space-x-4 px-4 py-3 rounded-lg font-orbitron text-sm font-semibold tracking-wide transition-all duration-300 ${isActive ? 'bg-cyber-blue/10 text-cyber-cyan border-l-2 border-cyber-cyan shadow-[0_0_15px_rgba(0,204,255,0.15)]' : 'text-gray-400 hover:bg-cyber-blue/5 hover:text-white'}`}>
                            <Apple size={18} />
                            <span>Diet Log</span>
                        </NavLink>
                        <NavLink to="/records" className={({ isActive }) => `flex items-center space-x-4 px-4 py-3 rounded-lg font-orbitron text-sm font-semibold tracking-wide transition-all duration-300 ${isActive ? 'bg-cyber-blue/10 text-cyber-cyan border-l-2 border-cyber-cyan shadow-[0_0_15px_rgba(0,204,255,0.15)]' : 'text-gray-400 hover:bg-cyber-blue/5 hover:text-white'}`}>
                            <Trophy size={18} />
                            <span>Personal Records</span>
                        </NavLink>
                        <NavLink to="/weight" className={({ isActive }) => `flex items-center space-x-4 px-4 py-3 rounded-lg font-orbitron text-sm font-semibold tracking-wide transition-all duration-300 ${isActive ? 'bg-cyber-blue/10 text-cyber-cyan border-l-2 border-cyber-cyan shadow-[0_0_15px_rgba(0,204,255,0.15)]' : 'text-gray-400 hover:bg-cyber-blue/5 hover:text-white'}`}>
                            <Scale size={18} />
                            <span>Body Weight</span>
                        </NavLink>
                        <NavLink to="/weekly-progress" className={({ isActive }) => `flex items-center space-x-4 px-4 py-3 rounded-lg font-orbitron text-sm font-semibold tracking-wide transition-all duration-300 ${isActive ? 'bg-cyber-blue/10 text-cyber-cyan border-l-2 border-cyber-cyan shadow-[0_0_15px_rgba(0,204,255,0.15)]' : 'text-gray-400 hover:bg-cyber-blue/5 hover:text-white'}`}>
                            <TrendingUp size={18} />
                            <span>Weekly Progress</span>
                        </NavLink>
                    </nav>
                </div>

                {/* User Profile & Logout at bottom of Sidebar */}
                <div className="space-y-4 pt-4 border-t border-cyber-blue/10">
                    <div className="px-2 truncate">
                        <span className="text-[10px] text-gray-500 block uppercase tracking-wider font-orbitron">Pilot Profile</span>
                        <span className="text-xs text-gray-300 truncate font-semibold block">{displayName}</span>
                    </div>
                    <button onClick={signOut} className="flex items-center justify-center space-x-2 w-full font-orbitron text-xs font-bold py-2 px-4 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 active:scale-95 transition-all duration-300">
                        <LogOut size={14} />
                        <span>Logout Protocol</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Header / Bottom Nav Wrapper */}
            <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
                {/* Main Content Area */}
                <main className="w-full flex-1 max-w-4xl mx-auto p-4 md:p-8 mb-20 md:mb-0">
                    <Outlet />
                </main>

                {/* Mobile Bottom Navigation (Hidden on Laptop/Desktop) */}
                <nav className="md:hidden fixed bottom-0 z-50 w-full bg-[#07070c] border-t border-cyber-blue/20 shadow-[0_-5px_20px_rgba(0,204,255,0.15)] backdrop-blur-xl bg-opacity-90">
                    <div className="flex justify-around items-center h-16">
                        <NavLink to="/" className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${isActive ? 'text-cyber-cyan scale-105' : 'text-gray-500 hover:text-cyber-blue'}`}>
                            {({ isActive }) => (
                                <>
                                    <Home size={18} className={isActive ? "text-cyber-cyan drop-shadow-[0_0_8px_rgba(0,245,255,0.8)]" : "text-gray-500"} />
                                    <span className={`mobile-nav-label uppercase font-orbitron mt-1 ${isActive ? 'text-cyber-cyan font-bold drop-shadow-[0_0_4px_rgba(0,245,255,0.4)]' : ''}`}>Dashboard</span>
                                </>
                            )}
                        </NavLink>
                        <NavLink to="/plan" className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${isActive ? 'text-cyber-cyan scale-105' : 'text-gray-500 hover:text-cyber-blue'}`}>
                            {({ isActive }) => (
                                <>
                                    <ClipboardList size={18} className={isActive ? "text-cyber-cyan drop-shadow-[0_0_8px_rgba(0,245,255,0.8)]" : "text-gray-500"} />
                                    <span className={`mobile-nav-label uppercase font-orbitron mt-1 ${isActive ? 'text-cyber-cyan font-bold drop-shadow-[0_0_4px_rgba(0,245,255,0.4)]' : ''}`}>Workout Plan</span>
                                </>
                            )}
                        </NavLink>
                        <NavLink to="/workout" className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${isActive ? 'text-cyber-cyan scale-105' : 'text-gray-500 hover:text-cyber-blue'}`}>
                            {({ isActive }) => (
                                <>
                                    <Dumbbell size={18} className={isActive ? "text-cyber-cyan drop-shadow-[0_0_8px_rgba(0,245,255,0.8)]" : "text-gray-500"} />
                                    <span className={`mobile-nav-label uppercase font-orbitron mt-1 ${isActive ? 'text-cyber-cyan font-bold drop-shadow-[0_0_4px_rgba(0,245,255,0.4)]' : ''}`}>Workout</span>
                                </>
                            )}
                        </NavLink>
                        <NavLink to="/diet-plan" className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${isActive ? 'text-cyber-cyan scale-105' : 'text-gray-500 hover:text-cyber-blue'}`}>
                            {({ isActive }) => (
                                <>
                                    <Sparkles size={18} className={isActive ? "text-cyber-cyan drop-shadow-[0_0_8px_rgba(0,245,255,0.8)]" : "text-gray-500"} />
                                    <span className={`mobile-nav-label uppercase font-orbitron mt-1 ${isActive ? 'text-cyber-cyan font-bold drop-shadow-[0_0_4px_rgba(0,245,255,0.4)]' : ''}`}>Diet Plan</span>
                                </>
                            )}
                        </NavLink>
                        <NavLink to="/diet" className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${isActive ? 'text-cyber-cyan scale-105' : 'text-gray-500 hover:text-cyber-blue'}`}>
                            {({ isActive }) => (
                                <>
                                    <Apple size={18} className={isActive ? "text-cyber-cyan drop-shadow-[0_0_8px_rgba(0,245,255,0.8)]" : "text-gray-500"} />
                                    <span className={`mobile-nav-label uppercase font-orbitron mt-1 ${isActive ? 'text-cyber-cyan font-bold drop-shadow-[0_0_4px_rgba(0,245,255,0.4)]' : ''}`}>Diet Log</span>
                                </>
                            )}
                        </NavLink>
                        <NavLink to="/records" className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${isActive ? 'text-cyber-cyan scale-105' : 'text-gray-500 hover:text-cyber-blue'}`}>
                            {({ isActive }) => (
                                <>
                                    <Trophy size={18} className={isActive ? "text-cyber-cyan drop-shadow-[0_0_8px_rgba(0,245,255,0.8)]" : "text-gray-500"} />
                                    <span className={`mobile-nav-label uppercase font-orbitron mt-1 ${isActive ? 'text-cyber-cyan font-bold drop-shadow-[0_0_4px_rgba(0,245,255,0.4)]' : ''}`}>Records</span>
                                </>
                            )}
                        </NavLink>
                        <NavLink to="/weight" className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${isActive ? 'text-cyber-cyan scale-105' : 'text-gray-500 hover:text-cyber-blue'}`}>
                            {({ isActive }) => (
                                <>
                                    <Scale size={18} className={isActive ? "text-cyber-cyan drop-shadow-[0_0_8px_rgba(0,245,255,0.8)]" : "text-gray-500"} />
                                    <span className={`mobile-nav-label uppercase font-orbitron mt-1 ${isActive ? 'text-cyber-cyan font-bold drop-shadow-[0_0_4px_rgba(0,245,255,0.4)]' : ''}`}>Weight</span>
                                </>
                            )}
                        </NavLink>
                        <NavLink to="/weekly-progress" className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${isActive ? 'text-cyber-cyan scale-105' : 'text-gray-500 hover:text-cyber-blue'}`}>
                            {({ isActive }) => (
                                <>
                                    <TrendingUp size={18} className={isActive ? "text-cyber-cyan drop-shadow-[0_0_8px_rgba(0,245,255,0.8)]" : "text-gray-500"} />
                                    <span className={`mobile-nav-label uppercase font-orbitron mt-1 ${isActive ? 'text-cyber-cyan font-bold drop-shadow-[0_0_4px_rgba(0,245,255,0.4)]' : ''}`}>Weekly</span>
                                </>
                            )}
                        </NavLink>
                    </div>
                </nav>
            </div>
        </div>
    );
}
