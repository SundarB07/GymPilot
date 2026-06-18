import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, CalendarPlus, ClipboardList, Utensils, Sparkles, Trophy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
    const { user, signOut, displayName } = useAuth();
    const [plan, setPlan] = useState(null);
    const [loadingPlan, setLoadingPlan] = useState(true);
    const [workoutCompleted, setWorkoutCompleted] = useState(false);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [totalPRs, setTotalPRs] = useState(0);
    const [latestPR, setLatestPR] = useState(null);

    useEffect(() => {
        async function fetchPlanAndStreak() {
            try {
                // 1. Fetch Plan
                const { data: planData, error: planError } = await supabase
                    .from('workoutplans')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (planError && planError.code !== 'PGRST116') {
                    throw planError;
                }

                setPlan(planData);

                // 2. Fetch Logs and calculate Streak & PRs
                const { data: logsData, error: logsError } = await supabase
                    .from('workout_logs')
                    .select('*')
                    .eq('user_id', user.id);

                if (logsError) throw logsError;

                // 3. Process logs to get unique sorted dates and calculate
                if (logsData) {
                    const uniqueDates = [...new Set(logsData.map(log => log.workout_date))].sort();
                    
                    if (planData && planData.plan_data && planData.plan_data.weekly_schedule) {
                        const workoutDayIndices = new Set(
                            planData.plan_data.weekly_schedule
                                .filter(d => !d.is_rest)
                                .map(d => d.day_index)
                        );

                        if (workoutDayIndices.size > 0 && uniqueDates.length > 0) {
                            const loggedSet = new Set(uniqueDates);
                            
                            const formatDate = (date) => {
                                const y = date.getFullYear();
                                const m = String(date.getMonth() + 1).padStart(2, '0');
                                const d = String(date.getDate()).padStart(2, '0');
                                return `${y}-${m}-${d}`;
                            };

                            const today = new Date();
                            const todayStr = formatDate(today);

                            const oldestStr = uniqueDates[0];
                            const oldestParts = oldestStr.split('-');
                            const oldestDate = new Date(parseInt(oldestParts[0], 10), parseInt(oldestParts[1], 10) - 1, parseInt(oldestParts[2], 10));

                            let tempStreak = 0;
                            let maxStreak = 0;

                            let iterDate = new Date(oldestDate);
                            iterDate.setHours(0, 0, 0, 0);
                            const endCompareDate = new Date(today);
                            endCompareDate.setHours(0, 0, 0, 0);

                            while (iterDate <= endCompareDate) {
                                const iterStr = formatDate(iterDate);
                                const jsDay = iterDate.getDay();
                                const mappedDayIdx = (jsDay + 6) % 7;
                                const isWorkoutDay = workoutDayIndices.has(mappedDayIdx);
                                const isLogged = loggedSet.has(iterStr);

                                if (isWorkoutDay) {
                                    if (isLogged) {
                                        tempStreak++;
                                        if (tempStreak > maxStreak) {
                                            maxStreak = tempStreak;
                                        }
                                    } else {
                                        if (iterStr !== todayStr) {
                                            tempStreak = 0;
                                        }
                                    }
                                }
                                iterDate.setDate(iterDate.getDate() + 1);
                            }

                            setCurrentStreak(tempStreak);
                            setBestStreak(maxStreak);
                        }
                    }

                    // Calculate PRs
                    const { data: exercisesData, error: exError } = await supabase
                        .from('exercises')
                        .select('id, exercise_name');

                    if (!exError && exercisesData) {
                        const prMap = {};
                        logsData.forEach(log => {
                            const ex = exercisesData.find(e => e.id === log.exercise_id);
                            if (!ex) return;

                            const exName = ex.exercise_name;
                            if (!prMap[exName]) {
                                prMap[exName] = {
                                    name: exName,
                                    best_weight: 0,
                                    date_weight: null,
                                    created_at: null
                                };
                            }

                            const pr = prMap[exName];
                            const dateStr = log.workout_date;
                            const createdAt = log.created_at;

                            if (log.set_logs && Array.isArray(log.set_logs)) {
                                log.set_logs.forEach(set => {
                                    const w = parseFloat(set.weight) || 0;
                                    if (w > pr.best_weight) {
                                        pr.best_weight = w;
                                        pr.date_weight = dateStr;
                                        pr.created_at = createdAt;
                                    }
                                });
                            } else {
                                const w = parseFloat(log.weight_used) || 0;
                                if (w > pr.best_weight) {
                                    pr.best_weight = w;
                                    pr.date_weight = dateStr;
                                    pr.created_at = createdAt;
                                }
                            }
                        });

                        const prList = Object.values(prMap).filter(p => p.best_weight > 0);
                        setTotalPRs(prList.length);

                        if (prList.length > 0) {
                            prList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                            setLatestPR(prList[0]);
                        }
                    }
                }
            } catch (err) {
                console.error('Error fetching dashboard plan and streak:', err);
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
            fetchPlanAndStreak();
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

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
                <div className="md:col-span-2 cyber-card p-4 border border-cyber-cyan/20">
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

                <div className="cyber-card p-4 border border-cyber-pink/20 flex flex-col justify-between">
                    <div>
                        <h3 className="font-orbitron text-cyber-pink mb-4 flex items-center space-x-2">
                            <span className="animate-pulse">🔥</span>
                            <span>Workout Streak</span>
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <span className="text-[10px] text-gray-500 font-orbitron uppercase tracking-widest block">Current Streak</span>
                                <span className="text-3xl font-extrabold font-orbitron text-white drop-shadow-[0_0_10px_rgba(254,83,187,0.4)]">
                                    {currentStreak} <span className="text-sm font-normal text-gray-400">Days</span>
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] text-gray-500 font-orbitron uppercase tracking-widest block">Best Streak</span>
                                <span className="text-xl font-bold font-orbitron text-cyber-cyan">
                                    {bestStreak} <span className="text-xs font-normal text-gray-400">Days</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <Link to="/records" className="cyber-card p-4 border border-cyber-cyan/20 flex flex-col justify-between hover:border-cyber-cyan/40 transition-all cursor-pointer">
                    <div>
                        <h3 className="font-orbitron text-cyber-cyan mb-4 flex items-center space-x-2">
                            <span>🏆</span>
                            <span>Personal Records</span>
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <span className="text-[10px] text-gray-500 font-orbitron uppercase tracking-widest block">Total PRs</span>
                                <span className="text-3xl font-extrabold font-orbitron text-white drop-shadow-[0_0_10px_rgba(0,245,255,0.4)]">
                                    {totalPRs}
                                </span>
                            </div>
                            {latestPR && (
                                <div>
                                    <span className="text-[10px] text-gray-500 font-orbitron uppercase tracking-widest block">Latest PR</span>
                                    <span className="text-xs font-semibold font-orbitron text-cyber-pink block mt-1 truncate max-w-full" title={`${latestPR.name} - ${latestPR.best_weight}kg`}>
                                        {latestPR.name} - {latestPR.best_weight}kg
                                    </span>
                                </div>
                            )}
                            {!latestPR && (
                                <div>
                                    <span className="text-[10px] text-gray-500 font-orbitron uppercase tracking-widest block">Latest PR</span>
                                    <span className="text-xs text-gray-500 italic block mt-1">None yet</span>
                                </div>
                            )}
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}
