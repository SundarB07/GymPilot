import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { generateDietPlan, calculateBMI, calculateTDEE } from '../utils/dietGenerator';

export default function GenerateDietPlan() {
    const { user, setDietPlan, setDietPlanLoaded } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        age: '25',
        height: '175',
        currentWeight: '70',
        goalWeight: '75',
        gender: 'male',
        activityLevel: 'moderate',
        goal: 'lean', // loss, maintenance, lean, fast
        style: 'Veg', // Veg, Non-Veg
        includeWhey: false,
        includeCreatine: false,
        localAvailable: '',
        localUnavailable: '',
        riceMeal: 'lunch'
    });

    const [liveMetrics, setLiveMetrics] = useState({
        bmi: 22.9,
        tdee: 2400,
        targetCalories: 2700
    });

    // Dynamically calculate BMI & Estimated TDEE on input changes
    useEffect(() => {
        const w = parseFloat(formData.currentWeight) || 0;
        const h = parseFloat(formData.height) || 0;
        const a = parseInt(formData.age) || 0;

        if (w > 0 && h > 0 && a > 0) {
            const bmi = calculateBMI(w, h);
            const tdee = calculateTDEE(w, h, a, formData.gender, formData.activityLevel);
            let targetCalories = tdee;
            if (formData.goal === 'loss') {
                targetCalories = tdee - 500;
            } else if (formData.goal === 'lean') {
                targetCalories = tdee + 300;
            } else if (formData.goal === 'fast') {
                targetCalories = tdee + 500;
            }

            if (targetCalories < 1200) targetCalories = 1200;

            setLiveMetrics({
                bmi,
                tdee,
                targetCalories: Math.round(targetCalories)
            });
        }
    }, [formData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ 
            ...formData, 
            [name]: type === 'checkbox' ? checked : value 
        });
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Fetch food items database from Supabase
            const { data: dbFoods, error: foodsError } = await supabase
                .from('foods')
                .select('*');

            if (foodsError) {
                console.warn('Could not read foods table, using standard defaults', foodsError);
            }

            // Generate diet plan details algorithmically
            const planDetails = generateDietPlan(formData, dbFoods || []);

            // Upsert to Supabase
            const { error: upsertError } = await supabase
                .from('dietplans')
                .upsert({
                    user_id: user.id,
                    age: parseInt(formData.age),
                    height: parseFloat(formData.height),
                    current_weight: parseFloat(formData.currentWeight),
                    goal_weight: parseFloat(formData.goalWeight),
                    bmi: planDetails.bmi,
                    target_calories: planDetails.targetCalories,
                    category: formData.goal,
                    style: formData.style,
                    plan_data: planDetails, // Plan data now contains items with macros
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (upsertError) throw upsertError;

            // Fetch the updated plan to populate the cache
            const { data: newPlan } = await supabase
                .from('dietplans')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (newPlan) {
                setDietPlan(newPlan);
                setDietPlanLoaded(true);
            }

            // Redirect to My Diet Plan page
            navigate('/diet-plan');

        } catch (err) {
            console.error(err);
            setError(err.message || 'An error occurred while generating your diet plan.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-8">
            <div className="flex items-center space-x-3 mb-6">
                <Sparkles className="text-cyber-cyan w-8 h-8 drop-shadow-[0_0_10px_rgba(0,245,255,0.8)] animate-pulse" />
                <h1 className="text-2xl font-bold font-orbitron neon-text">Diet Plan Generator</h1>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Metrics Preview */}
                <div className="md:col-span-1 space-y-4">
                    <div className="cyber-card p-6 flex flex-col items-center justify-center text-center space-y-4">
                        <span className="text-xs text-gray-500 uppercase tracking-widest font-orbitron">Current BMI</span>
                        <div className="text-4xl font-extrabold font-orbitron text-cyber-cyan">{liveMetrics.bmi}</div>
                        <span className="text-xs text-gray-400">
                            {liveMetrics.bmi < 18.5 ? 'Underweight' : liveMetrics.bmi < 25 ? 'Normal weight' : liveMetrics.bmi < 30 ? 'Overweight' : 'Obese'}
                        </span>
                    </div>

                    <div className="cyber-card p-6 flex flex-col items-center justify-center text-center space-y-4">
                        <span className="text-xs text-gray-500 uppercase tracking-widest font-orbitron">Daily Target Calories</span>
                        <div className="text-4xl font-extrabold font-orbitron text-cyber-blue">{liveMetrics.targetCalories} <span className="text-xs text-gray-500">kcal</span></div>
                        <span className="text-[10px] text-gray-400">Estimated TDEE maintenance: {Math.round(liveMetrics.tdee)} kcal</span>
                    </div>
                </div>

                {/* Main Form */}
                <form onSubmit={handleGenerate} className="md:col-span-2 cyber-card space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyber-blue/10 blur-3xl rounded-full"></div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        {/* Gender */}
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 uppercase tracking-wide font-orbitron">Gender</label>
                            <select name="gender" value={formData.gender} onChange={handleChange} className="w-full bg-[#050508] border border-cyber-blue/30 rounded p-2 text-white text-sm focus:outline-none focus:border-cyber-cyan">
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                        {/* Age */}
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 uppercase tracking-wide font-orbitron">Age (Years)</label>
                            <input type="number" name="age" min="10" max="100" value={formData.age} onChange={handleChange} className="cyber-input" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        {/* Height */}
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 uppercase tracking-wide font-orbitron">Height (cm)</label>
                            <input type="number" name="height" min="100" max="250" value={formData.height} onChange={handleChange} className="cyber-input" required />
                        </div>
                        {/* Weight */}
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 uppercase tracking-wide font-orbitron">Weight (kg)</label>
                            <input type="number" name="currentWeight" min="30" max="250" value={formData.currentWeight} onChange={handleChange} className="cyber-input" required />
                        </div>
                        {/* Goal Weight */}
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 uppercase tracking-wide font-orbitron">Goal Weight (kg)</label>
                            <input type="number" name="goalWeight" min="30" max="250" value={formData.goalWeight} onChange={handleChange} className="cyber-input" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Activity Level */}
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 uppercase tracking-wide font-orbitron">Activity Level</label>
                            <select name="activityLevel" value={formData.activityLevel} onChange={handleChange} className="w-full bg-[#050508] border border-cyber-blue/30 rounded p-2 text-white text-sm focus:outline-none focus:border-cyber-cyan">
                                <option value="sedentary">Sedentary</option>
                                <option value="light">Light Exercise</option>
                                <option value="moderate">Moderate Exercise</option>
                                <option value="heavy">Heavy Exercise</option>
                                <option value="athlete">Athlete</option>
                            </select>
                        </div>

                        {/* Goal Category */}
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 uppercase tracking-wide font-orbitron">Target Goal</label>
                            <select name="goal" value={formData.goal} onChange={handleChange} className="w-full bg-[#050508] border border-cyber-blue/30 rounded p-2 text-white text-sm focus:outline-none focus:border-cyber-cyan">
                                <option value="loss">Weight Loss</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="lean">Lean Muscle Gain</option>
                                <option value="fast">Fast Weight Gain</option>
                            </select>
                        </div>
                    </div>

                    {/* Diet Style */}
                    <div className="space-y-1">
                        <label className="text-xs text-gray-400 uppercase tracking-wide font-orbitron">Dietary Preference</label>
                        <select name="style" value={formData.style} onChange={handleChange} className="w-full bg-[#050508] border border-cyber-blue/30 rounded p-2 text-white text-sm focus:outline-none focus:border-cyber-cyan">
                            <option value="Veg">Veg</option>
                            <option value="Non-Veg">Non-Veg</option>
                        </select>
                    </div>

                    {/* Rice Meal Preference */}
                    <div className="space-y-1">
                        <label className="text-xs text-gray-400 uppercase tracking-wide font-orbitron">When will you eat Rice?</label>
                        <select name="riceMeal" value={formData.riceMeal} onChange={handleChange} className="w-full bg-[#050508] border border-cyber-blue/30 rounded p-2 text-white text-sm focus:outline-none focus:border-cyber-cyan">
                            <option value="breakfast">Breakfast</option>
                            <option value="lunch">Lunch</option>
                            <option value="dinner">Dinner</option>
                        </select>
                    </div>

                    {/* Supplement selection */}
                    <div className="p-3 rounded border border-gray-800 bg-[#0a0a0f] space-y-3">
                        <span className="text-xs text-gray-400 uppercase tracking-wide font-orbitron block">Supplement Protocols</span>
                        <div className="flex items-center space-x-6">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="includeWhey"
                                    checked={formData.includeWhey}
                                    onChange={handleChange}
                                    className="w-4 h-4 accent-cyber-blue"
                                />
                                <span className="text-xs text-gray-300 font-orbitron">Include Whey Protein</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="includeCreatine"
                                    checked={formData.includeCreatine}
                                    onChange={handleChange}
                                    className="w-4 h-4 accent-cyber-blue"
                                />
                                <span className="text-xs text-gray-300 font-orbitron">Include Creatine</span>
                            </label>
                        </div>
                    </div>

                    {/* Locality availability */}
                    <div className="space-y-2">
                        <h4 className="text-xs text-gray-450 uppercase tracking-wide font-orbitron">Locality Food Calibration</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-wider block">Foods Available in My Locality</label>
                                <input
                                    type="text"
                                    name="localAvailable"
                                    value={formData.localAvailable}
                                    onChange={handleChange}
                                    placeholder="e.g. eggs, chicken, peanut butter"
                                    className="cyber-input text-xs mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-wider block">Foods NOT Available / Avoid</label>
                                <input
                                    type="text"
                                    name="localUnavailable"
                                    value={formData.localUnavailable}
                                    onChange={handleChange}
                                    placeholder="e.g. tofu, soya, fish"
                                    className="cyber-input text-xs mt-1"
                                />
                            </div>
                        </div>
                    </div>

                    <button disabled={loading} type="submit" className="cyber-button w-full mt-6 flex justify-center text-md tracking-wider">
                        {loading ? (
                            <><Loader2 className="animate-spin mr-2" /> GENERATING PLAN...</>
                        ) : (
                            'INITIALIZE DIET PROTOCOL'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
