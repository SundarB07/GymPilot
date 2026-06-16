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
                            initialLogs[ex.id] = {
                                weight: '',
                                sets: ex.sets,
                                reps: ex.reps.split('-')[0] || ex.reps,
                                notes: ''
                            };
                        });
                        setLogs(initialLogs);
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
        setLogs(prev => ({
            ...prev,
            [exeId]: {
                ...prev[exeId],
                [field]: value
            }
        }));
    };

    const handleCompleteWorkout = async () => {
        setSaving(true);
        setError('');

        try {
            const logEntries = todayPlan.exercises.map(ex => {
                const repsStr = String(ex.reps || '');
                const repParts = repsStr.split('-');
                const minReps = parseInt(repParts[0], 10) || 0;
                const maxReps = repParts[1] ? (parseInt(repParts[1], 10) || minReps) : minReps;

                const userReps = logs[ex.id]?.reps;
                const actualReps = userReps ? parseInt(userReps, 10) : null;

                return {
                    user_id: user.id,
                    workout_date: new Date().toISOString().split('T')[0],
                    day_name: todayPlan.day_name,
                    exercise_id: ex.id,
                    sets_planned: ex.sets,
                    target_reps_min: minReps,
                    target_reps_max: maxReps,
                    weight_used: logs[ex.id]?.weight ? parseFloat(logs[ex.id].weight) : null,
                    sets_completed: logs[ex.id]?.sets ? parseInt(logs[ex.id].sets, 10) : null,
                    actual_reps: actualReps,
                    notes: logs[ex.id]?.notes || null
                };
            });

            const { error: insertError } = await supabase
                .from('workout_logs')
                .insert(logEntries);

            if (insertError) throw insertError;

            setCompleted(true);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to finish workout.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-cyber-cyan w-10 h-10" /></div>;

    if (completed) return (
        <div className="text-center space-y-6 animate-fade-in mt-16 p-6 cyber-card border-cyber-cyan shadow-[0_0_30px_rgba(0,245,255,0.2)]">
            <Award className="w-20 h-20 text-cyber-cyan mx-auto drop-shadow-[0_0_15px_rgba(0,245,255,0.8)]" />
            <div>
                <h2 className="text-3xl font-orbitron font-bold neon-text mb-2">Protocol Cleared!</h2>
                <p className="text-gray-300">Workout successfully logged. Excellent work.</p>
            </div>
            <Link to="/" className="cyber-button w-full mt-6">Return to Dashboard</Link>
        </div>
    );

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
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">{ex.muscle_group}</p>
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
                                            value={logs[ex.id]?.weight || ''}
                                            onChange={(e) => handleLogChange(ex.id, 'weight', e.target.value)}
                                            className="w-full bg-[#050508] border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-cyber-blue text-sm transition-colors"
                                        />
                                    </div>
                                    <div className="flex space-x-2">
                                        <div className="w-1/2">
                                            <label className="text-[10px] text-gray-500 uppercase tracking-widest pl-1 mb-1 block">Sets</label>
                                            <input
                                                type="number"
                                                value={logs[ex.id]?.sets || ''}
                                                onChange={(e) => handleLogChange(ex.id, 'sets', e.target.value)}
                                                className="w-full bg-[#050508] border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-cyber-blue text-sm transition-colors text-center font-orbitron"
                                            />
                                        </div>
                                        <div className="w-1/2">
                                            <label className="text-[10px] text-gray-500 uppercase tracking-widest pl-1 mb-1 block">Reps</label>
                                            <input
                                                type="text"
                                                value={logs[ex.id]?.reps || ''}
                                                onChange={(e) => handleLogChange(ex.id, 'reps', e.target.value)}
                                                className="w-full bg-[#050508] border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-cyber-blue text-sm transition-colors text-center font-orbitron"
                                            />
                                        </div>
                                    </div>
                                </div>

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
