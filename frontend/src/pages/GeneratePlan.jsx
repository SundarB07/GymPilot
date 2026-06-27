import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wand2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { generateWorkoutPlan } from '../utils/workoutGenerator';

export default function GeneratePlan() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        goal: 'Muscle Gain',
        level: 'Intermediate',
        daysPerWeek: '4',
        timePerSession: '60'
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const days = parseInt(formData.daysPerWeek, 10);

        if (days === 7) {
            setError("You need to take at least 1 rest day per week for recovery. Maximum workout days allowed is 6.");
            setLoading(false);
            return;
        }

        if (isNaN(days) || days < 1 || days > 6) {
            setError("Invalid training days selected. Please choose between 1 and 6 days per week.");
            setLoading(false);
            return;
        }

        try {
            // 1. Fetch available exercises from Supabase
            const { data: exercises, error: exError } = await supabase
                .from('exercises')
                .select('*');

            if (exError) throw exError;

            if (!exercises || exercises.length === 0) {
                throw new Error("No exercises found in the database. Please run the SQL seed script.");
            }

            // 2. Generate plan using heuristics
            const planData = generateWorkoutPlan(formData, exercises);

            // Validation: Count generated workout days
            const generatedWorkoutDays = planData.weekly_schedule.filter(day => !day.is_rest && day.focus !== 'Rest').length;
            if (generatedWorkoutDays !== days) {
                throw new Error(`Workout plan generation failed: generated days count (${generatedWorkoutDays}) does not match selected days (${days}).`);
            }

            // 3. Upsert to Supabase
            const { error: upsertError } = await supabase
                .from('workoutplans')
                .upsert({
                    user_id: user.id,
                    goal: formData.goal,
                    level: formData.level,
                    days_per_week: days,
                    time_per_session: parseInt(formData.timePerSession),
                    plan_data: planData,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (upsertError) throw upsertError;

            // 4. Navigate to My Plan
            navigate('/plan');

        } catch (err) {
            console.error(err);
            setError(err.message || 'An error occurred while generating the plan.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-8">
            <div className="flex items-center space-x-3 mb-6">
                <Wand2 className="text-cyber-cyan w-8 h-8 drop-shadow-[0_0_10px_rgba(0,245,255,0.8)] animate-pulse" />
                <h1 className="text-2xl font-bold font-orbitron neon-text">Plan Generator</h1>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm">{error}</div>}

            <form onSubmit={handleGenerate} className="cyber-card space-y-5">

                {/* Goal */}
                <div className="space-y-2">
                    <label className="text-sm text-gray-400 font-orbitron tracking-wide">Primary Goal</label>
                    <select
                        name="goal"
                        value={formData.goal}
                        onChange={handleChange}
                        className="w-full bg-[#050508] border border-cyber-blue/30 rounded-lg p-3 text-white focus:outline-none focus:border-cyber-cyan transition-colors"
                    >
                        <option value="Muscle Gain">Hypertrophy (Muscle Gain)</option>
                        <option value="Strength">Raw Strength</option>
                        <option value="Fat Loss">Fat Loss & Toning</option>
                        <option value="Endurance">Endurance</option>
                    </select>
                </div>

                {/* Level */}
                <div className="space-y-2">
                    <label className="text-sm text-gray-400 font-orbitron tracking-wide">Experience Level</label>
                    <select
                        name="level"
                        value={formData.level}
                        onChange={handleChange}
                        className="w-full bg-[#050508] border border-cyber-blue/30 rounded-lg p-3 text-white focus:outline-none focus:border-cyber-cyan transition-colors"
                    >
                        <option value="Beginner">Beginner (0-1 years)</option>
                        <option value="Intermediate">Intermediate (1-3 years)</option>
                        <option value="Advanced">Advanced (3+ years)</option>
                    </select>
                </div>

                {/* Days Per Week */}
                <div className="space-y-2">
                    <label className="text-sm text-gray-400 font-orbitron tracking-wide">Days Per Week</label>
                    <input
                        type="number"
                        name="daysPerWeek"
                        min="1"
                        max="6"
                        step="1"
                        value={formData.daysPerWeek}
                        onChange={handleChange}
                        placeholder="Enter days per week (1-6)"
                        className="cyber-input"
                        required
                    />
                    <div className="text-right text-cyber-cyan font-bold font-orbitron text-xs mt-1">Target: {formData.daysPerWeek} Days / Week</div>
                </div>

                {/* Time Per Session */}
                <div className="space-y-2">
                    <label className="text-sm text-gray-400 font-orbitron tracking-wide">Session Duration (mins)</label>
                    <select
                        name="timePerSession"
                        value={formData.timePerSession}
                        onChange={handleChange}
                        className="w-full bg-[#050508] border border-cyber-blue/30 rounded-lg p-3 text-white focus:outline-none focus:border-cyber-cyan transition-colors"
                    >
                        <option value="30">30 minutes</option>
                        <option value="45">45 minutes</option>
                        <option value="60">60 minutes</option>
                        <option value="90">90 minutes</option>
                    </select>
                </div>

                <button disabled={loading} type="submit" className="cyber-button w-full mt-6 flex justify-center text-lg">
                    {loading ? (
                        <><Loader2 className="animate-spin mr-2" /> Processing...</>
                    ) : (
                        'INITIALIZE PROTOCOL'
                    )}
                </button>
            </form>
        </div>
    );
}
