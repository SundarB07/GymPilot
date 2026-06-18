import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Activity, CheckCircle, Loader2, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TodayWorkout() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [todayPlan, setTodayPlan] = useState(null);
    const [logs, setLogs] = useState({});
    const [completed, setCompleted] = useState(false);
    const [existingLogs, setExistingLogs] = useState([]);
    const [justSubmitted, setJustSubmitted] = useState(false);
    const [exercisePRs, setExercisePRs] = useState({});
    const [achievedPRs, setAchievedPRs] = useState([]);

    useEffect(() => {
        async function fetchTodayPlan() {
            try {
                const { data, error } = await supabase
                    .from('workoutplans')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') throw error;

                if (data && data.plan_data && data.plan_data.weekly_schedule) {
                    const jsDayIndex = new Date().getDay();
                    const mappedIndex = (jsDayIndex + 6) % 7;

                    const today = data.plan_data.weekly_schedule.find(d => d.day_index === mappedIndex);
                    setTodayPlan({ ...today, planId: data.id });

                    if (today && !today.is_rest && today.exercises) {
                        const initialLogs = {};
                        today.exercises.forEach(ex => {
                            const defaultReps = ex.reps.split('-')[0] || ex.reps;
                            const setsCount = parseInt(ex.sets, 10) || 1;
                            const defaultSetLogs = Array.from({ length: setsCount }, () => ({
                                weight: '',
                                reps: defaultReps
                            }));
                            const savedUseDiffWeights = localStorage.getItem('gympilot_diff_weights_' + (user?.id || 'default') + '_' + ex.id) === 'true';
                            initialLogs[ex.id] = {
                                weight: '',
                                sets: ex.sets,
                                reps: defaultReps,
                                notes: '',
                                useDiffWeights: savedUseDiffWeights,
                                setLogs: defaultSetLogs
                            };
                        });
                        setLogs(initialLogs);

                        // Fetch exercise history to compute current PRs
                        const exerciseIds = today.exercises.map(ex => ex.id);
                        const { data: historyData, error: historyError } = await supabase
                            .from('workout_logs')
                            .select('*')
                            .eq('user_id', user.id)
                            .in('exercise_id', exerciseIds);

                        if (!historyError && historyData) {
                            const prMap = {};
                            today.exercises.forEach(ex => {
                                const exLogs = historyData.filter(l => l.exercise_id === ex.id);
                                let maxW = 0;
                                exLogs.forEach(log => {
                                    if (log.set_logs && Array.isArray(log.set_logs)) {
                                        log.set_logs.forEach(set => {
                                            const w = parseFloat(set.weight) || 0;
                                            if (w > maxW) maxW = w;
                                        });
                                    } else {
                                        const w = parseFloat(log.weight_used) || 0;
                                        if (w > maxW) maxW = w;
                                    }
                                });
                                prMap[ex.id] = maxW;
                            });
                            setExercisePRs(prMap);
                        }

                        // Check if today's workout has already been completed in DB
                        const todayStr = new Date().toISOString().split('T')[0];
                        const { data: logsData, error: logsError } = await supabase
                            .from('workout_logs')
                            .select('*')
                            .eq('user_id', user.id)
                            .eq('workout_date', todayStr);

                        if (logsError) throw logsError;

                        if (logsData && logsData.length > 0) {
                            setExistingLogs(logsData);
                            setCompleted(true);
                        }
                    }
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load today\'s plan.');
            } finally {
                setLoading(false);
            }
        }

        if (user) fetchTodayPlan();
    }, [user]);

    const handleLogChange = (exeId, field, value) => {
        setLogs(prev => {
            const currentEx = prev[exeId] || {};
            let updatedEx = {
                ...currentEx,
                [field]: value
            };

            // If sets count changes in normal mode, sync setLogs length
            if (field === 'sets') {
                const newSetsCount = parseInt(value, 10) || 0;
                let newSetLogs = currentEx.setLogs ? [...currentEx.setLogs] : [];
                if (newSetsCount > 0) {
                    if (newSetLogs.length < newSetsCount) {
                        const defaultReps = newSetLogs[0]?.reps || currentEx.reps || '';
                        while (newSetLogs.length < newSetsCount) {
                            newSetLogs.push({ weight: currentEx.weight || '', reps: defaultReps });
                        }
                    } else if (newSetLogs.length > newSetsCount) {
                        newSetLogs = newSetLogs.slice(0, newSetsCount);
                    }
                    updatedEx.setLogs = newSetLogs;
                }
            }

            return {
                ...prev,
                [exeId]: updatedEx
            };
        });
    };

    const handleDiffWeightsToggle = (exId, checked) => {
        localStorage.setItem('gympilot_diff_weights_' + (user?.id || 'default') + '_' + exId, checked ? 'true' : 'false');
        setLogs(prev => {
            const currentEx = prev[exId] || {};
            const setsCount = parseInt(currentEx.sets, 10) || 1;
            const existingSetLogs = currentEx.setLogs || [];
            let newSetLogs = [...existingSetLogs];

            if (newSetLogs.length < setsCount) {
                const defaultReps = newSetLogs[0]?.reps || currentEx.reps || '';
                while (newSetLogs.length < setsCount) {
                    newSetLogs.push({ weight: currentEx.weight || '', reps: defaultReps });
                }
            } else if (newSetLogs.length > setsCount) {
                newSetLogs = newSetLogs.slice(0, setsCount);
            }

            return {
                ...prev,
                [exId]: {
                    ...currentEx,
                    useDiffWeights: checked,
                    setLogs: newSetLogs
                }
            };
        });
    };

    const handleSetLogChange = (exId, setIdx, field, value) => {
        setLogs(prev => {
            const currentEx = prev[exId] || {};
            const newSetLogs = currentEx.setLogs ? [...currentEx.setLogs] : [];
            if (newSetLogs[setIdx]) {
                newSetLogs[setIdx] = {
                    ...newSetLogs[setIdx],
                    [field]: value
                };
            }
            return {
                ...prev,
                [exId]: {
                    ...currentEx,
                    setLogs: newSetLogs
                }
            };
        });
    };

    const handleAddSet = (exId) => {
        setLogs(prev => {
            const currentEx = prev[exId] || {};
            const newSetLogs = currentEx.setLogs ? [...currentEx.setLogs] : [];
            const defaultReps = newSetLogs[newSetLogs.length - 1]?.reps || currentEx.reps || '';
            const defaultWeight = newSetLogs[newSetLogs.length - 1]?.weight || currentEx.weight || '';
            newSetLogs.push({ weight: defaultWeight, reps: defaultReps });

            return {
                ...prev,
                [exId]: {
                    ...currentEx,
                    sets: newSetLogs.length,
                    setLogs: newSetLogs
                }
            };
        });
    };

    const handleRemoveSet = (exId) => {
        setLogs(prev => {
            const currentEx = prev[exId] || {};
            const newSetLogs = currentEx.setLogs ? [...currentEx.setLogs] : [];
            if (newSetLogs.length > 1) {
                newSetLogs.pop();
            }
            return {
                ...prev,
                [exId]: {
                    ...currentEx,
                    sets: newSetLogs.length,
                    setLogs: newSetLogs
                }
            };
        });
    };

    const handleCompleteWorkout = async () => {
        setSaving(true);
        setError('');

        try {
            const todayStr = new Date().toISOString().split('T')[0];

            const logEntries = todayPlan.exercises.map(ex => {
                const repsStr = String(ex.reps || '');
                const repParts = repsStr.split('-');
                const minReps = parseInt(repParts[0], 10) || 0;
                const maxReps = repParts[1] ? (parseInt(repParts[1], 10) || minReps) : minReps;

                const exLog = logs[ex.id] || {};
                const isPerSet = exLog.useDiffWeights;

                let weightUsed = null;
                let setsCompleted = null;
                let actualReps = null;
                let workoutVolume = 0;
                let setLogsPayload = null;

                if (isPerSet && exLog.setLogs) {
                    setsCompleted = exLog.setLogs.length;
                    setLogsPayload = exLog.setLogs.map(s => ({
                        weight: s.weight ? parseFloat(s.weight) : 0,
                        reps: s.reps ? parseInt(s.reps, 10) : 0
                    }));
                    workoutVolume = setLogsPayload.reduce((sum, s) => sum + (s.weight * s.reps), 0);
                    weightUsed = setLogsPayload[0]?.weight || null;
                    actualReps = setLogsPayload[0]?.reps || null;
                } else {
                    weightUsed = exLog.weight ? parseFloat(exLog.weight) : null;
                    setsCompleted = exLog.sets ? parseInt(exLog.sets, 10) : null;
                    actualReps = exLog.reps ? parseInt(exLog.reps, 10) : null;

                    if (weightUsed !== null && setsCompleted !== null && actualReps !== null) {
                        workoutVolume = weightUsed * setsCompleted * actualReps;
                    }
                }

                return {
                    user_id: user.id,
                    workout_date: todayStr,
                    day_name: todayPlan.day_name,
                    exercise_id: ex.id,
                    sets_planned: ex.sets,
                    target_reps_min: minReps,
                    target_reps_max: maxReps,
                    weight_used: weightUsed,
                    sets_completed: setsCompleted,
                    actual_reps: actualReps,
                    notes: exLog.notes || null,
                    workout_volume: workoutVolume,
                    set_logs: setLogsPayload
                };
            });

            // Fetch previous logs for these exercises to detect PRs
            const exerciseIds = todayPlan.exercises.map(ex => ex.id);
            const { data: prevLogs, error: prevError } = await supabase
                .from('workout_logs')
                .select('*')
                .eq('user_id', user.id)
                .in('exercise_id', exerciseIds)
                .neq('workout_date', todayStr);

            const newPRs = [];
            if (!prevError && prevLogs) {
                todayPlan.exercises.forEach(ex => {
                    const exLogs = prevLogs.filter(l => l.exercise_id === ex.id);
                    let prevBestWeight = 0;
                    let prevBestVolume = 0;
                    let prevBestReps = 0;

                    exLogs.forEach(log => {
                        if (log.set_logs && Array.isArray(log.set_logs)) {
                            log.set_logs.forEach(set => {
                                const w = parseFloat(set.weight) || 0;
                                const r = parseInt(set.reps, 10) || 0;
                                const vol = w * r;
                                if (w > prevBestWeight) prevBestWeight = w;
                                if (r > prevBestReps) prevBestReps = r;
                                if (vol > prevBestVolume) prevBestVolume = vol;
                            });
                        } else {
                            const w = parseFloat(log.weight_used) || 0;
                            const r = parseInt(log.actual_reps, 10) || 0;
                            const vol = w * r;
                            if (w > prevBestWeight) prevBestWeight = w;
                            if (r > prevBestReps) prevBestReps = r;
                            if (vol > prevBestVolume) prevBestVolume = vol;
                        }
                    });

                    // Compare against current log entries
                    const currentEntry = logEntries.find(l => l.exercise_id === ex.id);
                    const hasWeight = currentEntry && (
                        (currentEntry.weight_used !== null && parseFloat(currentEntry.weight_used) > 0) ||
                        (currentEntry.set_logs && currentEntry.set_logs.some(s => parseFloat(s.weight) > 0))
                    );

                    if (currentEntry && hasWeight) {
                        if (currentEntry.set_logs && Array.isArray(currentEntry.set_logs)) {
                            let beatWeight = false;
                            let beatVolume = false;
                            let beatReps = false;
                            let highestW = prevBestWeight;
                            let highestV = prevBestVolume;
                            let highestR = prevBestReps;

                            currentEntry.set_logs.forEach(s => {
                                const curW = parseFloat(s.weight) || 0;
                                const curR = parseInt(s.reps, 10) || 0;
                                const curVol = curW * curR;

                                if (curW > highestW) {
                                    beatWeight = true;
                                    highestW = curW;
                                }
                                if (curR > highestR) {
                                    beatReps = true;
                                    highestR = curR;
                                }
                                if (curVol > highestV) {
                                    beatVolume = true;
                                    highestV = curVol;
                                }
                            });

                            if (beatWeight) {
                                newPRs.push({ exerciseName: ex.name, type: 'Weight', previous: prevBestWeight, current: `${highestW}kg` });
                            }
                            if (beatReps) {
                                newPRs.push({ exerciseName: ex.name, type: 'Reps', previous: prevBestReps, current: `${highestR} Reps` });
                            }
                            if (beatVolume) {
                                newPRs.push({ exerciseName: ex.name, type: 'Volume', previous: prevBestVolume, current: `${highestV} Vol` });
                            }
                        } else {
                            const curW = parseFloat(currentEntry.weight_used) || 0;
                            const curR = parseInt(currentEntry.actual_reps, 10) || 0;
                            const curVol = curW * curR;

                            if (curW > prevBestWeight) {
                                newPRs.push({ exerciseName: ex.name, type: 'Weight', previous: prevBestWeight, current: `${curW}kg` });
                            }
                            if (curR > prevBestReps) {
                                newPRs.push({ exerciseName: ex.name, type: 'Reps', previous: prevBestReps, current: `${curR} Reps` });
                            }
                            if (curVol > prevBestVolume) {
                                newPRs.push({ exerciseName: ex.name, type: 'Volume', previous: prevBestVolume, current: `${curVol} Vol` });
                            }
                        }
                    }
                });
            }
            setAchievedPRs(newPRs);

            // 1. Delete any existing workout logs for today to prevent duplicates
            const { error: deleteError } = await supabase
                .from('workout_logs')
                .delete()
                .eq('user_id', user.id)
                .eq('workout_date', todayStr);

            if (deleteError) throw deleteError;

            // 2. Insert new workout logs
            const { error: insertError } = await supabase
                .from('workout_logs')
                .insert(logEntries);

            if (insertError) throw insertError;

            // 3. Fetch newly inserted logs to populate existingLogs state
            const { data: freshLogs, error: fetchError } = await supabase
                .from('workout_logs')
                .select('*')
                .eq('user_id', user.id)
                .eq('workout_date', todayStr);

            if (fetchError) throw fetchError;

            if (freshLogs) {
                setExistingLogs(freshLogs);
            }
            setJustSubmitted(true);
            setCompleted(true);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to finish workout.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-cyber-cyan w-10 h-10" /></div>;

    if (completed) {
        const totalSets = existingLogs.reduce((sum, log) => sum + (log.sets_completed || 0), 0);
        const totalVolume = existingLogs.reduce((sum, log) => sum + parseFloat(log.workout_volume || 0), 0);
        const exerciseNames = existingLogs.map(log => {
            const ex = todayPlan?.exercises?.find(e => e.id === log.exercise_id);
            return ex ? ex.name : 'Unknown Exercise';
        }).filter(name => name !== 'Unknown Exercise').join(', ') || 'No exercises logged';

        const completionTime = existingLogs[0] ? new Date(existingLogs[0].created_at).toLocaleString() : new Date().toLocaleString();

        if (justSubmitted) {
            return (
                <div className="text-center space-y-6 animate-fade-in mt-16 p-6 cyber-card border-cyber-cyan shadow-[0_0_30px_rgba(0,245,255,0.2)] max-w-lg mx-auto">
                    <Award className="w-20 h-20 text-cyber-cyan mx-auto drop-shadow-[0_0_15px_rgba(0,245,255,0.8)] animate-pulse" />
                    <div>
                        <h2 className="text-3xl font-orbitron font-bold neon-text mb-2">Protocol Cleared!</h2>
                        <p className="text-gray-300 text-sm">Workout successfully logged. Excellent work.</p>
                    </div>

                    {achievedPRs && achievedPRs.length > 0 && (
                        <div className="mt-4 p-4 border border-cyber-pink/30 bg-[#0f0f15] rounded-lg text-left space-y-3">
                            <h3 className="text-sm font-orbitron text-cyber-pink flex items-center gap-2">
                                <span>🏆</span>
                                <span>NEW PERSONAL RECORDS!</span>
                            </h3>
                            <div className="space-y-2 text-xs">
                                {Object.entries(
                                    achievedPRs.reduce((acc, pr) => {
                                        if (!acc[pr.exerciseName]) {
                                            acc[pr.exerciseName] = [];
                                        }
                                        acc[pr.exerciseName].push(pr);
                                        return acc;
                                    }, {})
                                ).map(([exerciseName, prList], index) => {
                                    const prLine = prList.map(pr => `${pr.type} PR: ${pr.current}`).join(' / ');
                                    return (
                                        <div key={index} className="border-b border-gray-800/60 pb-2 last:border-0 last:pb-0 flex flex-col py-1">
                                            <span className="font-orbitron font-semibold text-white">{exerciseName}</span>
                                            <span className="text-[10px] text-cyber-cyan font-orbitron mt-0.5">
                                                {prLine}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="pt-4">
                        <Link to="/" className="cyber-button w-full py-3">
                            Return to Dashboard
                        </Link>
                    </div>
                </div>
            );
        }

        return (
            <div className="text-center space-y-6 animate-fade-in mt-16 p-6 cyber-card border-cyber-cyan shadow-[0_0_30px_rgba(0,245,255,0.2)] max-w-lg mx-auto">
                <CheckCircle className="w-20 h-20 text-cyber-cyan mx-auto drop-shadow-[0_0_15px_rgba(0,245,255,0.8)]" />
                <div>
                    <h2 className="text-3xl font-orbitron font-bold neon-text mb-2">Workout Completed </h2>
                </div>

                <div className="border-t border-b border-gray-800 py-4 my-2 text-left space-y-3 font-orbitron text-xs">
                    <div className="flex justify-between">
                        <span className="text-gray-500 uppercase tracking-wider">Completed On:</span>
                        <span className="text-white">{completionTime}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500 uppercase tracking-wider">Exercises Completed:</span>
                        <span className="text-cyber-cyan text-right truncate max-w-[200px]" title={exerciseNames}>{exerciseNames}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500 uppercase tracking-wider">Total Sets Completed:</span>
                        <span className="text-white">{totalSets} sets</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500 uppercase tracking-wider">Total Volume:</span>
                        <span className="text-cyber-pink font-bold">{totalVolume} kg/lbs</span>
                    </div>
                </div>

                {/* Stored workout statistics */}
                <div className="text-left space-y-2 mt-4">
                    <h3 className="text-xs font-orbitron text-cyber-blue uppercase tracking-widest mb-2">Logged Exercises Details</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {existingLogs.map((log) => {
                            const ex = todayPlan?.exercises?.find(e => e.id === log.exercise_id);
                            if (!ex) return null;
                            return (
                                <div key={log.id} className="bg-[#09090f] border border-gray-800 p-2.5 rounded text-xs">
                                    <div className="flex justify-between font-semibold mb-1">
                                        <span className="text-white font-orbitron">{ex.name}</span>
                                        <span className="text-cyber-cyan">{log.sets_completed} Sets</span>
                                    </div>
                                    {log.set_logs && Array.isArray(log.set_logs) ? (
                                        <div className="grid grid-cols-2 gap-1 text-[10px] text-gray-400 mt-1 border-t border-gray-900 pt-1">
                                            {log.set_logs.map((s, sIdx) => (
                                                <div key={sIdx} className="font-orbitron">
                                                    Set {sIdx + 1}: <span className="text-gray-300">{s.weight} kg/lbs × {s.reps} reps</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-[10px] text-gray-400">
                                            Weight: <span className="text-gray-300">{log.weight_used} kg/lbs</span> | Reps: <span className="text-gray-300 font-orbitron">{log.actual_reps} reps</span>
                                        </div>
                                    )}
                                    {log.notes && (
                                        <div className="text-[10px] text-gray-500 italic mt-1 font-sans">
                                            Note: {log.notes}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-col space-y-3 pt-4">
                    <button
                        onClick={() => {
                            const loadedLogs = {};
                            if (todayPlan && todayPlan.exercises) {
                                todayPlan.exercises.forEach(ex => {
                                    const savedLog = existingLogs.find(log => log.exercise_id === ex.id);
                                    if (savedLog) {
                                        loadedLogs[ex.id] = {
                                            weight: savedLog.weight_used !== null ? savedLog.weight_used : '',
                                            sets: savedLog.sets_completed !== null ? savedLog.sets_completed : ex.sets,
                                            reps: savedLog.actual_reps !== null ? savedLog.actual_reps : ex.reps.split('-')[0],
                                            notes: savedLog.notes || '',
                                            useDiffWeights: savedLog.set_logs ? true : false,
                                            setLogs: savedLog.set_logs || Array.from({ length: savedLog.sets_completed || ex.sets }, () => ({
                                                weight: savedLog.weight_used !== null ? savedLog.weight_used : '',
                                                reps: savedLog.actual_reps !== null ? savedLog.actual_reps : ex.reps.split('-')[0]
                                            }))
                                        };
                                    }
                                });
                                setLogs(loadedLogs);
                            }
                            setCompleted(false);
                        }}
                        className="cyber-button-outline w-full py-2.5 cursor-pointer font-orbitron font-semibold uppercase tracking-wider text-xs animate-pulse"
                    >
                        Edit Workout Log
                    </button>
                    <Link to="/" className="text-xs text-gray-500 hover:text-white transition-colors uppercase tracking-widest font-semibold font-orbitron pt-2">
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    if (!todayPlan) return (
        <div className="text-center space-y-4 mt-10 p-6 cyber-card border-dashed">
            <p className="text-gray-400">No active protocol detected.</p>
            <Link to="/generate-plan" className="cyber-button-outline inline-flex text-sm py-2">Initialize Plan First</Link>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="flex items-center justify-between mb-4 border-b border-cyber-blue/20 pb-4">
                <div className="flex items-center space-x-3">
                    <Activity className="text-cyber-pink w-8 h-8 drop-shadow-[0_0_10px_rgba(254,83,187,0.8)]" />
                    <div>
                        <h1 className="text-2xl font-bold font-orbitron neon-text">Today's Protocol</h1>
                        <p className="text-sm text-cyber-blue font-semibold uppercase tracking-widest">{todayPlan.day_name}</p>
                    </div>
                </div>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm">{error}</div>}

            {todayPlan.is_rest ? (
                <div className="cyber-card p-10 text-center border-cyber-blue/10 bg-[#0a0a0f]">
                    <h2 className="text-3xl font-orbitron text-gray-500 font-bold tracking-widest uppercase opacity-50 mb-4">Rest Day</h2>
                    <p className="text-gray-400">Recovery is part of the protocol. Rest your systems.</p>
                </div>
            ) : (
                <>
                    <div className="inline-block bg-cyber-pink/20 border border-cyber-pink/50 text-cyber-pink px-3 py-1 rounded text-xs tracking-wider uppercase font-bold shadow-[0_0_8px_rgba(254,83,187,0.4)] mb-2">
                        Focus: {todayPlan.focus}
                    </div>

                    <div className="space-y-5">
                        {todayPlan.exercises && todayPlan.exercises.map((ex) => (
                            <div key={ex.id} className="cyber-card p-4 border-cyber-blue/30 bg-[#0f0f15]">
                                <div className="flex justify-between items-start mb-4 border-b border-gray-800 pb-3">
                                    <div>
                                        <h3 className="font-orbitron font-semibold text-white tracking-wide">{ex.name}</h3>
                                        <div className="flex items-center space-x-3 mt-1 text-[10px]">
                                            <span className="text-gray-400 uppercase tracking-wider">{ex.muscle_group}</span>
                                            {exercisePRs[ex.id] !== undefined && exercisePRs[ex.id] > 0 && (
                                                <span className="text-cyber-pink font-semibold uppercase tracking-wider">
                                                    🏆 Current PR: {exercisePRs[ex.id]}kg
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-cyber-cyan block mb-1 uppercase tracking-widest font-semibold">Target</span>
                                        <span className="bg-[#1a1a24] border border-cyber-blue/20 px-2 py-1 rounded font-orbitron text-sm text-gray-300">
                                            {ex.sets} x {ex.reps}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                        <label className="text-[10px] text-gray-500 uppercase tracking-widest pl-1 mb-1 block">Weight (kg/lbs)</label>
                                        <input
                                            type="number"
                                            placeholder="e.g. 50"
                                            disabled={logs[ex.id]?.useDiffWeights}
                                            value={logs[ex.id]?.weight || ''}
                                            onChange={(e) => handleLogChange(ex.id, 'weight', e.target.value)}
                                            className="w-full bg-[#050508] border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-cyber-blue text-sm transition-colors disabled:opacity-50"
                                        />
                                    </div>
                                    <div className="flex space-x-2">
                                        <div className="w-1/2">
                                            <label className="text-[10px] text-gray-500 uppercase tracking-widest pl-1 mb-1 block">Sets</label>
                                            <input
                                                type="number"
                                                value={logs[ex.id]?.sets !== undefined && logs[ex.id]?.sets !== null ? logs[ex.id]?.sets : (ex.sets || '')}
                                                onChange={(e) => handleLogChange(ex.id, 'sets', e.target.value)}
                                                className="w-full bg-[#050508] border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-cyber-blue text-sm transition-colors text-center font-orbitron"
                                            />
                                        </div>
                                        <div className="w-1/2">
                                            <label className="text-[10px] text-gray-500 uppercase tracking-widest pl-1 mb-1 block">Reps</label>
                                            <input
                                                type="text"
                                                disabled={logs[ex.id]?.useDiffWeights}
                                                value={logs[ex.id]?.reps !== undefined && logs[ex.id]?.reps !== null ? logs[ex.id]?.reps : (ex.reps?.split('-')[0] || ex.reps || '')}
                                                onChange={(e) => handleLogChange(ex.id, 'reps', e.target.value)}
                                                className="w-full bg-[#050508] border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-cyber-blue text-sm transition-colors text-center font-orbitron disabled:opacity-50"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Use Different Weights Toggle */}
                                <div className="flex items-center space-x-2.5 mb-3 select-none">
                                    <label className="flex items-center space-x-2.5 cursor-pointer">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={logs[ex.id]?.useDiffWeights || false}
                                                onChange={(e) => handleDiffWeightsToggle(ex.id, e.target.checked)}
                                                className="sr-only"
                                            />
                                            <div className={`w-4 h-4 rounded border transition-all duration-300 flex items-center justify-center ${logs[ex.id]?.useDiffWeights
                                                    ? 'border-cyber-cyan bg-cyber-cyan/10 shadow-[0_0_8px_rgba(0,245,255,0.5)]'
                                                    : 'border-gray-700 bg-[#050508] hover:border-cyber-blue/50'
                                                }`}>
                                                {logs[ex.id]?.useDiffWeights && (
                                                    <div className="w-1.5 h-1.5 bg-cyber-cyan rounded-sm shadow-[0_0_4px_#00f5ff]"></div>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold font-orbitron">
                                            Used Different Weights Per Set
                                        </span>
                                    </label>
                                </div>

                                {/* Per-Set Inputs */}
                                {logs[ex.id]?.useDiffWeights && (
                                    <div className="mb-4 space-y-2.5 border-t border-gray-800/60 pt-3">
                                        <span className="text-[9px] text-cyber-cyan font-orbitron uppercase tracking-widest block font-semibold mb-1">Set-by-Set Logging</span>
                                        {logs[ex.id]?.setLogs?.map((setLog, setIdx) => (
                                            <div key={setIdx} className="flex items-center space-x-3 text-xs">
                                                <span className="text-gray-500 font-orbitron w-12 text-[10px] uppercase tracking-wide">Set {setIdx + 1}:</span>
                                                <div className="flex-1 flex space-x-2">
                                                    <div className="w-1/2">
                                                        <input
                                                            type="number"
                                                            placeholder="Weight (kg/lbs)"
                                                            value={setLog.weight || ''}
                                                            onChange={(e) => handleSetLogChange(ex.id, setIdx, 'weight', e.target.value)}
                                                            className="w-full bg-[#050508] border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-cyber-blue text-sm transition-colors"
                                                        />
                                                    </div>
                                                    <div className="w-1/2">
                                                        <input
                                                            type="number"
                                                            placeholder="Reps"
                                                            value={setLog.reps || ''}
                                                            onChange={(e) => handleSetLogChange(ex.id, setIdx, 'reps', e.target.value)}
                                                            className="w-full bg-[#050508] border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-cyber-blue text-sm transition-colors text-center font-orbitron"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="flex justify-between items-center pt-2">
                                            <button
                                                type="button"
                                                onClick={() => handleAddSet(ex.id)}
                                                className="text-[9px] text-cyber-cyan font-orbitron uppercase tracking-widest hover:underline cursor-pointer font-bold"
                                            >
                                                + Add Extra Set
                                            </button>
                                            {logs[ex.id]?.setLogs?.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveSet(ex.id)}
                                                    className="text-[9px] text-red-400 font-orbitron uppercase tracking-widest hover:underline cursor-pointer font-bold"
                                                >
                                                    - Remove Set
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <input
                                        type="text"
                                        placeholder="Optional notes..."
                                        value={logs[ex.id]?.notes || ''}
                                        onChange={(e) => handleLogChange(ex.id, 'notes', e.target.value)}
                                        className="w-full bg-transparent border-b border-gray-800 p-1 text-xs text-gray-400 placeholder-gray-600 focus:outline-none focus:border-cyber-blue/50 focus:text-gray-300 transition-colors"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        disabled={saving}
                        onClick={handleCompleteWorkout}
                        className="cyber-button w-full mt-8 py-4 text-lg"
                    >
                        {saving ? (
                            <><Loader2 className="animate-spin mr-2" /> UPLOADING TELEMETRY...</>
                        ) : (
                            <><CheckCircle className="mr-2" /> FINISH WORKOUT</>
                        )}
                    </button>
                </>
            )}
        </div>
    );
}
