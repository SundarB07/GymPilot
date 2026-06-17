import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ClipboardList, Loader2, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MyPlan() {
    const { user } = useAuth();
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditingSchedule, setIsEditingSchedule] = useState(false);
    const [tempSchedule, setTempSchedule] = useState([]);
    const [saveError, setSaveError] = useState('');
    const [savingSchedule, setSavingSchedule] = useState(false);

    const startEditing = () => {
        if (plan && plan.plan_data && plan.plan_data.weekly_schedule) {
            setTempSchedule(JSON.parse(JSON.stringify(plan.plan_data.weekly_schedule)));
            setSaveError('');
            setIsEditingSchedule(true);
        }
    };

    const saveSchedule = async () => {
        setSavingSchedule(true);
        setSaveError('');
        try {
            const originalWorkoutSessions = plan.plan_data.weekly_schedule
                .filter(d => !d.is_rest && d.focus !== 'Rest')
                .map(d => ({
                    focus: d.focus,
                    exercises: d.exercises
                }));

            let sessionIdx = 0;
            const newWeeklySchedule = tempSchedule.map(day => {
                if (!day.is_rest) {
                    const session = originalWorkoutSessions[sessionIdx] || { focus: 'Full Body', exercises: [] };
                    sessionIdx++;
                    return {
                        ...day,
                        focus: session.focus,
                        is_rest: false,
                        exercises: session.exercises
                    };
                } else {
                    return {
                        ...day,
                        focus: 'Rest',
                        is_rest: true,
                        exercises: []
                    };
                }
            });

            const updatedPlanData = {
                ...plan.plan_data,
                weekly_schedule: newWeeklySchedule
            };

            const { data, error: updateError } = await supabase
                .from('workoutplans')
                .update({ plan_data: updatedPlanData })
                .eq('id', plan.id)
                .select()
                .single();

            if (updateError) throw updateError;

            setPlan(data);
            setIsEditingSchedule(false);
        } catch (err) {
            console.error(err);
            setSaveError('Failed to save customized schedule.');
        } finally {
            setSavingSchedule(false);
        }
    };

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
                console.error(err);
                setError('Failed to load your workout plan.');
            } finally {
                setLoading(false);
            }
        }

        if (user) fetchPlan();
    }, [user]);

    if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-cyber-cyan w-10 h-10" /></div>;

    if (error) return <div className="text-red-400 text-center p-4 bg-red-500/10 rounded-lg">{error}</div>;

    if (!plan) return (
        <div className="text-center space-y-6 animate-fade-in mt-10 p-6 cyber-card border-dashed border-cyber-blue/40">
            <Info className="w-16 h-16 text-cyber-blue mx-auto opacity-70 drop-shadow-[0_0_8px_rgba(0,204,255,0.5)]" />
            <div>
                <h2 className="text-2xl font-orbitron neon-text mb-2">No Protocol Found</h2>
                <p className="text-sm text-gray-400">You haven't initialized a workout schedule yet.</p>
            </div>
            <Link to="/generate-plan" className="cyber-button inline-flex mt-4">
                Initialize New Protocol
            </Link>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="flex justify-between items-end mb-6 border-b border-cyber-blue/20 pb-4">
                <div>
                    <div className="flex items-center space-x-3 mb-2">
                        <ClipboardList className="text-cyber-blue w-8 h-8 drop-shadow-[0_0_10px_rgba(0,204,255,0.8)]" />
                        <h1 className="text-2xl font-bold font-orbitron neon-text">Active Protocol</h1>
                    </div>
                    <p className="text-[11px] text-cyber-cyan tracking-widest uppercase">Goal: <span className="text-white">{plan.goal}</span> | Level: <span className="text-white">{plan.level}</span></p>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={startEditing}
                        className="text-[10px] text-cyber-cyan uppercase font-orbitron hover:text-white border border-cyber-cyan/50 px-3 py-1.5 rounded transition-all hover:bg-cyber-cyan/10 cursor-pointer"
                    >
                        Customize Schedule
                    </button>
                    <Link to="/generate-plan" className="text-[10px] text-cyber-blue uppercase font-orbitron hover:text-cyber-cyan border border-cyber-blue/50 px-3 py-1.5 rounded transition-all hover:bg-cyber-blue/10">
                        Regenerate
                    </Link>
                </div>
            </div>

            {isEditingSchedule ? (
                <div className="cyber-card space-y-4 border-cyber-cyan/30">
                    <div className="flex justify-between items-center border-b border-cyber-blue/20 pb-3">
                        <h2 className="text-lg font-orbitron neon-text">Customize Workout Days</h2>
                        <span className={`text-xs font-orbitron font-semibold ${tempSchedule.filter(d => !d.is_rest).length === plan.days_per_week ? 'text-cyber-cyan' : 'text-red-400'}`}>
                            Selected: {tempSchedule.filter(d => !d.is_rest).length} / {plan.days_per_week} Days
                        </span>
                    </div>

                    {saveError && <div className="text-red-400 text-sm bg-red-500/10 p-2.5 rounded border border-red-500/30">{saveError}</div>}

                    <div className="space-y-2.5">
                        {tempSchedule.map((day, idx) => {
                            const isWorkout = !day.is_rest;
                            return (
                                <div key={day.day_index} className="flex justify-between items-center bg-[#09090f] border border-gray-800 p-3.5 rounded-lg">
                                    <div className="font-orbitron font-semibold text-sm text-white">
                                        {day.day_name}
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <span className={`text-xs font-orbitron px-2 py-0.5 rounded ${isWorkout ? 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30' : 'bg-gray-800/50 text-gray-500 border border-gray-800'}`}>
                                            {isWorkout ? 'Workout Day' : 'Rest Day'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                let updated = tempSchedule.map((d, i) => {
                                                    if (i === idx) {
                                                        return { ...d, is_rest: !d.is_rest };
                                                    }
                                                    return d;
                                                });
                                                const workoutCount = updated.filter(d => !d.is_rest).length;
                                                if (workoutCount > plan.days_per_week) {
                                                    // Reallocate: find first workout day other than the current one
                                                    const replaceIdx = updated.findIndex((d, i) => !d.is_rest && i !== idx);
                                                    if (replaceIdx !== -1) {
                                                        updated[replaceIdx] = { ...updated[replaceIdx], is_rest: true };
                                                    }
                                                }
                                                setTempSchedule(updated);
                                            }}
                                            className={`text-[10px] uppercase font-orbitron font-semibold px-3 py-1.5 rounded transition-all cursor-pointer ${isWorkout ? 'border border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/10'}`}
                                        >
                                            {isWorkout ? 'Make Rest' : 'Make Workout'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex space-x-3 pt-3 border-t border-gray-800">
                        <button
                            onClick={saveSchedule}
                            disabled={savingSchedule || tempSchedule.filter(d => !d.is_rest).length !== plan.days_per_week}
                            className="cyber-button py-2 flex-1 text-xs"
                        >
                            {savingSchedule ? 'Saving Schedule...' : 'Save Schedule'}
                        </button>
                        <button
                            onClick={() => setIsEditingSchedule(false)}
                            disabled={savingSchedule}
                            className="cyber-button-outline py-2 flex-1 text-xs"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {(plan.plan_data.weekly_schedule || [])
                        .filter(day => !day.is_rest && day.focus !== 'Rest')
                        .slice(0, plan.days_per_week)
                        .map((day, idx) => (
                            <div key={day.day_index} className="cyber-card overflow-hidden p-0 border-cyber-blue/30 shadow-neon-blue/5">
                                <div className="px-4 py-3 bg-gradient-to-r from-cyber-blue/10 to-transparent flex justify-between items-center">
                                    <div className="font-orbitron font-semibold text-white text-sm">
                                        <span className="text-cyber-blue mr-2">DAY {idx + 1}</span>
                                        {day.day_name}
                                    </div>
                                    <div className="text-[10px] px-2 py-0.5 rounded tracking-wider uppercase font-semibold bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30 shadow-[0_0_5px_rgba(0,245,255,0.3)]">
                                        {day.focus}
                                    </div>
                                </div>

                                {day.exercises && day.exercises.length > 0 && (
                                    <div className="px-4 py-3 space-y-3 bg-[#0a0a0f]">
                                        {day.exercises.map((ex, idxEx) => (
                                            <div key={idxEx} className="flex justify-between items-center border-b border-gray-800/60 pb-2 last:border-0 last:pb-0">
                                                <div className="flex flex-col">
                                                    <span className="text-gray-200 text-sm font-medium">{ex.name}</span>
                                                    <span className="text-[10px] text-cyber-blue/70 uppercase">{ex.muscle_group}</span>
                                                </div>
                                                <div className="text-right font-orbitron text-[11px] text-cyber-cyan tracking-wide bg-[#12121c] px-3 py-1 rounded border border-cyber-blue/20">
                                                    {ex.sets} <span className="text-gray-400 mx-1">x</span> <span className="text-white text-xs">{ex.reps}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {(!day.exercises || day.exercises.length === 0) && (
                                    <div className="p-4 text-sm text-gray-500 italic bg-[#0a0a0f]">Data unavailable.</div>
                                )}
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
}
