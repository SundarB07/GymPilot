import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, CalendarPlus, ClipboardList, Utensils, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
    const { user, signOut, displayName } = useAuth();
    const [plan, setPlan] = useState(null);
    const [loadingPlan, setLoadingPlan] = useState(true);
    const [workoutCompleted, setWorkoutCompleted] = useState(false);

    useEffect(() => {
        async function fetchPlan() {
            try {
                const { data, error } = await supabase
                    .from('workoutplans')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    throw error;
                }

                if (data) setPlan(data);
            } catch (err) {
                console.error('Error fetching workout plan for dashboard:', err);
            } finally {
                setLoadingPlan(false);
            }
        }

        async function checkWorkoutCompletion() {
            if (!user) return;
            try {
                const todayStr = new Date().toISOString().split('T')[0];
                const { data, error } = await supabase
                    .from('workout_logs')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('workout_date', todayStr)
                    .limit(1);

                if (error) throw error;
                if (data && data.length > 0) {
                    setWorkoutCompleted(true);
                }
            } catch (err) {
                console.error('Error checking workout completion:', err);
            }
        }

        if (user) {
            fetchPlan();
            checkWorkoutCompletion();
        }
    }, [user]);

    const getTodaySchedule = () => {
        if (!plan || !plan.plan_data || !plan.plan_data.weekly_schedule) return null;
        const jsDayIndex = new Date().getDay();
        const mappedIndex = (jsDayIndex + 6) % 7;
        return plan.plan_data.weekly_schedule.find(d => d.day_index === mappedIndex);
    };

    const todaySchedule = getTodaySchedule();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold neon-text md:hidden">GymPilot</h1>
                    <h1 className="text-3xl font-extrabold font-orbitron tracking-wider text-white hidden md:block">COMMAND CENTER</h1>
                    <p className="text-sm text-gray-400">Welcome back, {displayName}</p>
                </div>
                <button onClick={signOut} className="md:hidden text-xs text-cyber-blue border border-cyber-blue/30 px-3 py-1 rounded hover:bg-cyber-blue/10 transition-colors">
                    Logout
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-center">
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
                    <span className="font-orbitron text-sm font-semibold tracking-wide flex flex-col items-center">
                        <span>Today's Workout</span>
                        {workoutCompleted && <span className="text-emerald-400 text-xs mt-1">Completed </span>}
                    </span>
                </Link>

                <Link to="/diet-plan" className="cyber-card flex flex-col items-center justify-center p-6 space-y-3 cursor-pointer">
                    <Sparkles className="text-emerald-400 w-10 h-10 mb-2 drop-shadow-[0_0_10px_rgba(52,211,153,0.6)]" />
                    <span className="font-orbitron text-sm font-semibold tracking-wide">Diet Plan</span>
                </Link>

                <Link to="/diet" className="cyber-card flex flex-col items-center justify-center p-6 space-y-3 cursor-pointer">
                    <Utensils className="text-purple-400 w-10 h-10 mb-2 drop-shadow-[0_0_10px_rgba(183,108,253,0.6)]" />
                    <span className="font-orbitron text-sm font-semibold tracking-wide">Diet Log</span>
                </Link>
            </div>

            <div className="mt-8 cyber-card p-4 border border-cyber-cyan/20">
                <h3 className="font-orbitron text-cyber-cyan mb-2">Protocol Status</h3>
                {loadingPlan ? (
                    <p className="text-sm text-gray-500">Retrieving command telemetry...</p>
                ) : !plan ? (
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                        <p className="text-sm text-gray-400">No active protocol detected. You haven't initialized a workout plan yet.</p>
                        <Link to="/generate-plan" className="text-xs font-orbitron bg-cyber-blue/10 text-cyber-cyan border border-cyber-cyan/30 px-3 py-1.5 rounded hover:bg-cyber-cyan/10 transition-all font-semibold tracking-wide self-start sm:self-auto uppercase">
                            Initialize Protocol
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start border-b border-gray-800 pb-2">
                            <div>
                                <span className="text-[9px] text-gray-500 font-orbitron uppercase tracking-widest block">Active Plan</span>
                                <span className="text-sm font-semibold text-white uppercase font-orbitron tracking-wide">Goal: {plan.goal} ({plan.level})</span>
                            </div>
                            {todaySchedule && (
                                <div className="text-left sm:text-right mt-2 sm:mt-0">
                                    <span className="text-[9px] text-gray-500 font-orbitron uppercase tracking-widest block">Today's Focus</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded tracking-wider uppercase font-semibold font-orbitron inline-block mt-1 ${todaySchedule.is_rest ? 'bg-gray-800 text-gray-400' : 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30 shadow-[0_0_5px_rgba(0,245,255,0.3)]'}`}>
                                        {todaySchedule.focus}
                                    </span>
                                </div>
                            )}
                        </div>
                        {todaySchedule && !todaySchedule.is_rest && todaySchedule.exercises && (
                            <div>
                                <span className="text-[9px] text-gray-500 font-orbitron uppercase tracking-widest block mb-2">Today's Telemetry Protocol</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                    {todaySchedule.exercises.map((ex, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-[#09090f] border border-gray-800/60 p-2.5 rounded">
                                            <span className="text-gray-300 font-semibold truncate max-w-[150px]">{ex.name}</span>
                                            <span className="text-cyber-cyan font-orbitron">{ex.sets}x{ex.reps}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {todaySchedule && todaySchedule.is_rest && (
                            <p className="text-sm text-gray-400 italic">No workouts scheduled for today. Rest and recover your systems.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
