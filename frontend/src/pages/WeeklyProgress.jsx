import { useEffect, useState } from 'react';
import { Activity, Dumbbell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function WeeklyProgress() {
    const { user } = useAuth();
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [prListState, setPrListState] = useState([]);
    const [currentWeight, setCurrentWeight] = useState(null);
    const [weeklyWeightChange, setWeeklyWeightChange] = useState(null);
    const [startingWeight, setStartingWeight] = useState(null);

    // Weekly Progress Dashboard states
    const [weeklyWorkoutLogs, setWeeklyWorkoutLogs] = useState([]);
    const [weeklyDietLogs, setWeeklyDietLogs] = useState([]);
    const [activeDietPlan, setActiveDietPlan] = useState(null);

    useEffect(() => {
        async function fetchWeeklyTelemetry() {
            if (!user) return;
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
                        setPrListState(prList);
                    }

                    // Past 7 Days dates calculation
                    const getPast7DaysDates = () => {
                        const dates = [];
                        for (let i = 6; i >= 0; i--) {
                            const d = new Date();
                            d.setDate(d.getDate() - i);
                            const y = d.getFullYear();
                            const m = String(d.getMonth() + 1).padStart(2, '0');
                            const day = String(d.getDate()).padStart(2, '0');
                            dates.push(`${y}-${m}-${day}`);
                        }
                        return dates;
                    };
                    const last7DaysStrings = getPast7DaysDates();

                    const filteredWorkouts = logsData.filter(log => last7DaysStrings.includes(log.workout_date));
                    setWeeklyWorkoutLogs(filteredWorkouts);
                }

                // 3. Fetch Weight Logs
                const { data: weightData, error: weightError } = await supabase
                    .from('weight_logs')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('log_date', { ascending: true });

                if (!weightError && weightData && weightData.length > 0) {
                    const latest = weightData[weightData.length - 1];
                    setCurrentWeight(parseFloat(latest.weight));
                    setStartingWeight(parseFloat(weightData[0].weight));

                    if (weightData.length > 1) {
                        const latestDate = new Date(latest.log_date);
                        const targetDate = new Date(latestDate);
                        targetDate.setDate(targetDate.getDate() - 7);

                        let closestEntry = weightData[0];
                        let minDiff = Math.abs(new Date(closestEntry.log_date) - targetDate);

                        weightData.forEach(entry => {
                            const diff = Math.abs(new Date(entry.log_date) - targetDate);
                            if (diff < minDiff) {
                                minDiff = diff;
                                closestEntry = entry;
                            }
                        });

                        if (closestEntry.id !== latest.id) {
                            const change = parseFloat(latest.weight) - parseFloat(closestEntry.weight);
                            setWeeklyWeightChange(change);
                        }
                    }
                }

                // 4. Fetch Weekly Diet Plan and Diet Logs
                const { data: dietPlanData } = await supabase
                    .from('dietplans')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();
                setActiveDietPlan(dietPlanData);

                const getPast7DaysDates = () => {
                    const dates = [];
                    for (let i = 6; i >= 0; i--) {
                        const d = new Date();
                        d.setDate(d.getDate() - i);
                        const y = d.getFullYear();
                        const m = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        dates.push(`${y}-${m}-${day}`);
                    }
                    return dates;
                };
                const last7DaysStrings = getPast7DaysDates();

                const { data: dietLogsData } = await supabase
                    .from('dietlogs')
                    .select('*')
                    .eq('user_id', user.id)
                    .gte('date', last7DaysStrings[0]);
                if (dietLogsData) {
                    setWeeklyDietLogs(dietLogsData);
                }
            } catch (err) {
                console.error('Error fetching weekly telemetry:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchWeeklyTelemetry();
    }, [user]);

    // Weekly Progress Calculations
    const getPast7DaysDates = () => {
        const dates = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            dates.push(`${y}-${m}-${day}`);
        }
        return dates;
    };
    const last7Days = getPast7DaysDates();

    const uniqueWorkoutDaysCount = new Set(weeklyWorkoutLogs.map(log => log.workout_date)).size;
    const plannedWorkoutDaysCount = plan && plan.plan_data && plan.plan_data.weekly_schedule
        ? plan.plan_data.weekly_schedule.filter(d => !d.is_rest).length
        : 0;

    const totalExercisesCompleted = weeklyWorkoutLogs.length;

    const calculateLogVolume = (log) => {
        if (log.set_logs && Array.isArray(log.set_logs)) {
            return log.set_logs.reduce((sum, set) => sum + (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0), 0);
        }
        return (parseFloat(log.weight_used) || 0) * (parseInt(log.actual_reps) || 0) * (parseInt(log.sets_completed) || 0);
    };
    const totalWeeklyVolume = weeklyWorkoutLogs.reduce((sum, log) => sum + calculateLogVolume(log), 0);

    const weeklyNewPRs = prListState.filter(pr => pr.date_weight && last7Days.includes(pr.date_weight));
    const newPRsCount = weeklyNewPRs.length;

    const targetCalories = activeDietPlan ? Number(activeDietPlan.target_calories || 0) : 0;
    const targetProtein = activeDietPlan?.plan_data?.macros?.protein ? Number(activeDietPlan.plan_data.macros.protein) : 0;

    const dailyNutrients = {};
    last7Days.forEach(date => {
        dailyNutrients[date] = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, logged: false };
    });
    weeklyDietLogs.forEach(log => {
        if (dailyNutrients[log.date]) {
            dailyNutrients[log.date].calories += Number(log.calories || 0);
            const wheyProtein = log.whey_taken ? (Number(log.whey_grams || 0) * 0.8) : 0;
            dailyNutrients[log.date].protein += Number(log.protein || 0) + wheyProtein;
            dailyNutrients[log.date].carbs += Number(log.carbs || 0);
            dailyNutrients[log.date].fat += Number(log.fat || 0);
            dailyNutrients[log.date].fiber += Number(log.fiber || 0);
            dailyNutrients[log.date].logged = true;
        }
    });

    const avgCalories = Math.round(Object.values(dailyNutrients).reduce((sum, d) => sum + d.calories, 0) / 7);
    const avgProtein = Math.round(Object.values(dailyNutrients).reduce((sum, d) => sum + d.protein, 0) / 7);
    const avgCarbs = Math.round(Object.values(dailyNutrients).reduce((sum, d) => sum + d.carbs, 0) / 7);
    const avgFat = Math.round(Object.values(dailyNutrients).reduce((sum, d) => sum + d.fat, 0) / 7);
    const avgFiber = Math.round(Object.values(dailyNutrients).reduce((sum, d) => sum + d.fiber, 0) / 7);

    let proteinHits = 0;
    let caloriesHits = 0;
    last7Days.forEach(date => {
        const d = dailyNutrients[date];
        if (d.protein >= targetProtein && targetProtein > 0) proteinHits++;
        if (d.calories >= targetCalories && targetCalories > 0) caloriesHits++;
    });

    const proteinCompliance = targetProtein > 0 ? Math.round((proteinHits / 7) * 100) : 0;
    const caloriesCompliance = targetCalories > 0 ? Math.round((caloriesHits / 7) * 100) : 0;

    const generateProgressSummary = () => {
        const summaries = [];
        const workoutDaysPct = plannedWorkoutDaysCount > 0 ? (uniqueWorkoutDaysCount / plannedWorkoutDaysCount) * 100 : 0;
        
        if (uniqueWorkoutDaysCount > 0) {
            if (workoutDaysPct >= 80) {
                summaries.push("Great progress this week. Workout consistency improved.");
            } else if (workoutDaysPct < 50) {
                summaries.push("Workout consistency dropped this week.");
            } else {
                summaries.push("Good effort keeping up with workouts.");
            }
        } else {
            summaries.push("Workout consistency dropped this week.");
        }

        if (activeDietPlan) {
            if (proteinCompliance >= 70) {
                summaries.push("Protein target met on most days.");
            } else if (proteinCompliance < 40) {
                summaries.push("Protein intake needs improvement.");
            }
        }

        if (weeklyWeightChange !== null) {
            if (weeklyWeightChange < 0) {
                summaries.push("Weight moved closer to goal.");
            } else if (weeklyWeightChange > 0) {
                summaries.push("Weight increased this week.");
            }
        }

        return summaries.join(" ");
    };
    const progressSummary = generateProgressSummary();

    const hasWeeklyData = weeklyWorkoutLogs.length > 0 || weeklyDietLogs.length > 0 || currentWeight !== null;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <p className="text-gray-500 font-orbitron">Retrieving weekly diagnostics...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-3">
                <Activity className="text-cyber-cyan w-8 h-8 drop-shadow-[0_0_10px_rgba(0,245,255,0.8)]" />
                <h1 className="text-2xl md:text-3xl font-extrabold font-orbitron tracking-wider text-white uppercase neon-text">Weekly Progress Telemetry</h1>
            </div>

            {!hasWeeklyData ? (
                <div className="cyber-card p-6 text-center border border-dashed border-gray-800">
                    <p className="text-sm text-gray-500 font-orbitron uppercase tracking-wider mb-1">Not enough data yet.</p>
                    <p className="text-xs text-gray-600">Complete workouts and log meals to generate weekly analytics.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Progress Summary Banner */}
                    {progressSummary && (
                        <div className="cyber-card p-4 border border-cyber-blue/20 bg-cyber-blue/5">
                            <span className="text-[9px] text-cyber-cyan font-orbitron uppercase tracking-widest block mb-1">Weekly Diagnostics</span>
                            <p className="text-xs text-gray-300 font-medium tracking-wide leading-relaxed">{progressSummary}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Workout Performance Card */}
                        <div className="cyber-card p-4 space-y-4 border border-gray-800/80">
                            <h3 className="font-orbitron text-xs text-cyber-cyan uppercase tracking-widest border-b border-gray-800/80 pb-2">Workout Performance</h3>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="bg-[#050508] border border-gray-800 p-2.5 rounded">
                                    <span className="text-[8px] text-gray-500 uppercase tracking-widest block mb-1">Completed</span>
                                    <span className="text-sm font-bold font-orbitron text-white">{uniqueWorkoutDaysCount} <span className="text-[9px] text-gray-500 font-normal">/ {plannedWorkoutDaysCount}</span></span>
                                </div>
                                <div className="bg-[#050508] border border-gray-800 p-2.5 rounded">
                                    <span className="text-[8px] text-gray-500 uppercase tracking-widest block mb-1">Exercises</span>
                                    <span className="text-sm font-bold font-orbitron text-cyber-cyan">{totalExercisesCompleted}</span>
                                </div>
                                <div className="bg-[#050508] border border-gray-800 p-2.5 rounded">
                                    <span className="text-[8px] text-gray-500 uppercase tracking-widest block mb-1">Volume</span>
                                    <span className="text-sm font-bold font-orbitron text-cyber-pink">{totalWeeklyVolume.toLocaleString()} <span className="text-[8px] font-normal">kg</span></span>
                                </div>
                            </div>

                            {/* Completion progress bar */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-[9px] font-orbitron uppercase text-gray-500">
                                    <span>Weekly Target Completion</span>
                                    <span>{plannedWorkoutDaysCount > 0 ? Math.round((uniqueWorkoutDaysCount / plannedWorkoutDaysCount) * 100) : 0}%</span>
                                </div>
                                <div className="w-full bg-[#050508] rounded-full h-1.5 border border-gray-800">
                                    <div 
                                        className="bg-cyber-cyan h-1.5 rounded-full shadow-[0_0_8px_#00f5ff]" 
                                        style={{ width: `${Math.min(100, plannedWorkoutDaysCount > 0 ? (uniqueWorkoutDaysCount / plannedWorkoutDaysCount) * 100 : 0)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Nutrition & Averages Card */}
                        <div className="cyber-card p-4 space-y-4 border border-gray-800/80">
                            <h3 className="font-orbitron text-xs text-purple-400 uppercase tracking-widest border-b border-gray-800/80 pb-2">Nutrition & Averages</h3>
                            <div className="grid grid-cols-5 gap-1.5 text-center">
                                <div className="bg-[#050508] border border-gray-800 p-1.5 rounded">
                                    <span className="text-[7px] text-gray-500 uppercase tracking-widest block mb-0.5">Calories</span>
                                    <span className="text-xs font-bold font-orbitron text-white">{avgCalories} <span className="text-[6px] text-gray-500 font-normal">kcal</span></span>
                                </div>
                                <div className="bg-[#050508] border border-gray-800 p-1.5 rounded">
                                    <span className="text-[7px] text-gray-500 uppercase tracking-widest block mb-0.5">Protein</span>
                                    <span className="text-xs font-bold font-orbitron text-cyber-cyan">{avgProtein}g</span>
                                </div>
                                <div className="bg-[#050508] border border-gray-800 p-1.5 rounded">
                                    <span className="text-[7px] text-gray-500 uppercase tracking-widest block mb-0.5">Carbs</span>
                                    <span className="text-xs font-bold font-orbitron text-cyber-blue">{avgCarbs}g</span>
                                </div>
                                <div className="bg-[#050508] border border-gray-800 p-1.5 rounded">
                                    <span className="text-[7px] text-gray-500 uppercase tracking-widest block mb-0.5">Fats</span>
                                    <span className="text-xs font-bold font-orbitron text-cyber-pink">{avgFat}g</span>
                                </div>
                                <div className="bg-[#050508] border border-gray-800 p-1.5 rounded">
                                    <span className="text-[7px] text-gray-500 uppercase tracking-widest block mb-0.5">Fiber</span>
                                    <span className="text-xs font-bold font-orbitron text-purple-400">{avgFiber}g</span>
                                </div>
                            </div>

                            {/* Compliance progress bars */}
                            <div className="space-y-2">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[9px] font-orbitron uppercase text-gray-500">
                                        <span>Protein Compliance</span>
                                        <span>{proteinCompliance}%</span>
                                    </div>
                                    <div className="w-full bg-[#050508] rounded-full h-1 border border-gray-800">
                                        <div 
                                            className="bg-cyber-cyan h-1 rounded-full" 
                                            style={{ width: `${proteinCompliance}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[9px] font-orbitron uppercase text-gray-500">
                                        <span>Calories Compliance</span>
                                        <span>{caloriesCompliance}%</span>
                                    </div>
                                    <div className="w-full bg-[#050508] rounded-full h-1 border border-gray-800">
                                        <div 
                                            className="bg-purple-500 h-1 rounded-full" 
                                            style={{ width: `${caloriesCompliance}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Streak Overview */}
                        <div className="cyber-card p-4 border border-gray-800/80 space-y-3">
                            <h4 className="font-orbitron text-xs text-cyber-pink uppercase tracking-widest">Streak Overview</h4>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500">Current Streak:</span>
                                <span className="font-bold text-white font-orbitron">{currentStreak} days</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500">Best Streak:</span>
                                <span className="font-bold text-cyber-cyan font-orbitron">{bestStreak} days</span>
                            </div>
                        </div>

                        {/* Weekly PRs */}
                        <div className="cyber-card p-4 border border-gray-800/80 space-y-3">
                            <h4 className="font-orbitron text-xs text-cyber-cyan uppercase tracking-widest">Weekly PRs ({newPRsCount})</h4>
                            {weeklyNewPRs.length > 0 ? (
                                <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                                    {weeklyNewPRs.map((pr, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-[11px]">
                                            <span className="text-gray-300 font-medium truncate max-w-[65%]" title={pr.name}>{pr.name}</span>
                                            <span className="text-cyber-pink font-bold font-orbitron">{pr.best_weight}kg</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500 italic">No new PRs set this week.</p>
                            )}
                        </div>

                        {/* Weight Progress */}
                        <div className="cyber-card p-4 border border-gray-800/80 space-y-3">
                            <h4 className="font-orbitron text-xs text-cyber-blue uppercase tracking-widest">Weight Progress</h4>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500">Starting Weight:</span>
                                <span className="font-bold text-white font-orbitron">{startingWeight !== null ? `${startingWeight} kg` : 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500">Current Weight:</span>
                                <span className="font-bold text-white font-orbitron">{currentWeight !== null ? `${currentWeight} kg` : 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500">Weekly Change:</span>
                                <span className={`font-bold font-orbitron ${weeklyWeightChange > 0 ? 'text-rose-500' : weeklyWeightChange < 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
                                    {weeklyWeightChange !== null ? (weeklyWeightChange >= 0 ? `+${weeklyWeightChange.toFixed(1)}` : `${weeklyWeightChange.toFixed(1)}`) : '0.0'} kg
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
