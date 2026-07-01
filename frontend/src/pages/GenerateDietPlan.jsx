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

    const [creationMode, setCreationMode] = useState('auto'); // 'auto' or 'manual'
    const [dbFoods, setDbFoods] = useState([]);

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
        targetCalories: 2700,
        protein: 140,
        carbs: 300,
        fat: 56,
        fiber: 38
    });

    const [customMeals, setCustomMeals] = useState({
        '🌅 Breakfast': [],
        '🍛 Lunch': [],
        '🥜 Snack': [],
        '🌙 Dinner': [],
        '🏋️ Pre Workout': [],
        '⚡ Post Workout': []
    });

    const [addingFood, setAddingFood] = useState({
        mealKey: null,
        searchQuery: '',
        suggestions: [],
        selectedFood: null,
        quantity: '',
        isCustom: false,
        customName: '',
        customCalories: '',
        customProtein: '',
        customCarbs: '',
        customFat: '',
        customFiber: ''
    });

    const mealKeys = [
        { key: 'Breakfast', name: '🌅 Breakfast' },
        { key: 'Lunch', name: '🍛 Lunch' },
        { key: 'Snack', name: '🥜 Snack' },
        { key: 'Dinner', name: '🌙 Dinner' },
        { key: 'Pre Workout', name: '🏋️ Pre Workout' },
        { key: 'Post Workout', name: '⚡ Post Workout' }
    ];

    // Load database foods on mount
    useEffect(() => {
        async function fetchFoods() {
            try {
                const { data } = await supabase.from('foods').select('*');
                if (data) setDbFoods(data);
            } catch (err) {
                console.error('Error fetching foods:', err);
            }
        }
        fetchFoods();
    }, []);

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

            // Calculate recommended targets
            let protein = 0;
            if (formData.goal === 'loss') {
                protein = w * 2.2;
            } else if (formData.goal === 'maintenance') {
                protein = w * 1.6;
            } else {
                protein = w * 2.0;
            }
            protein = Math.round(protein);

            let fat = Math.round(w * 0.8);
            const proteinCalories = protein * 4;
            const fatCalories = fat * 9;
            const remainingCalories = targetCalories - proteinCalories - fatCalories;
            let carbs = Math.round(Math.max(0, remainingCalories) / 4);
            const fiber = Math.round((targetCalories / 1000) * 14);

            setLiveMetrics({
                bmi,
                tdee,
                targetCalories: Math.round(targetCalories),
                protein,
                carbs,
                fat,
                fiber
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

    const handleSearchChange = (query) => {
        setAddingFood(prev => {
            const filtered = dbFoods.filter(f =>
                f.food_name.toLowerCase().includes(query.toLowerCase())
            ).slice(0, 5);
            return {
                ...prev,
                searchQuery: query,
                suggestions: filtered
            };
        });
    };

    const handleSelectSuggestion = (food) => {
        setAddingFood(prev => ({
            ...prev,
            selectedFood: food,
            searchQuery: food.food_name,
            suggestions: []
        }));
    };

    const getUnit = (food) => {
        if (!food) return 'g';
        const name = food.food_name.toLowerCase();
        if (name.includes('egg') || name.includes('banana') || name.includes('apple') || name.includes('chapati') || name.includes('roti') || name.includes('idli') || name.includes('dosa') || name.includes('appam')) {
            return 'piece';
        }
        if (name.includes('milk') || name.includes('buttermilk') || food.category === 'Drink') {
            return 'ml';
        }
        return 'g';
    };

    const calculateMacros = (food, qtyStr) => {
        const qty = parseFloat(qtyStr) || 0;
        if (qty <= 0) return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
        const unit = getUnit(food);
        const scale = (unit === 'piece') ? qty : qty / 100;
        return {
            calories: Math.round(Number(food.calories_kcal) * scale),
            protein: Math.round(Number(food.protein_g) * scale),
            carbs: Math.round(Number(food.carbs_g) * scale),
            fat: Math.round(Number(food.fat_g) * scale),
            fiber: Math.round(Number(food.fiber_g || 0) * scale)
        };
    };

    const handleAddFoodToMeal = (mealName) => {
        const { selectedFood, quantity, isCustom, customName, customCalories, customProtein, customCarbs, customFat, customFiber } = addingFood;

        let newItem = null;

        if (isCustom) {
            if (!customName) return;
            newItem = {
                name: customName,
                calories: Math.round(Number(customCalories) || 0),
                protein: Math.round(Number(customProtein) || 0),
                carbs: Math.round(Number(customCarbs) || 0),
                fat: Math.round(Number(customFat) || 0),
                fiber: Math.round(Number(customFiber) || 0),
                is_optional: false,
                alternative_name: null
            };
        } else {
            if (!selectedFood || !quantity) return;
            const unit = getUnit(selectedFood);
            const qty = parseFloat(quantity) || 0;
            const nameWithQty = (unit === 'piece') 
                ? `${qty} ${selectedFood.food_name}${qty > 1 ? 's' : ''}`
                : `${qty}${unit} ${selectedFood.food_name}`;
            
            const computed = calculateMacros(selectedFood, quantity);
            newItem = {
                name: nameWithQty,
                ...computed,
                is_optional: false,
                alternative_name: null
            };
        }

        if (newItem) {
            setCustomMeals(prev => ({
                ...prev,
                [mealName]: [...(prev[mealName] || []), newItem]
            }));
            setAddingFood({
                mealKey: null,
                searchQuery: '',
                suggestions: [],
                selectedFood: null,
                quantity: '',
                isCustom: false,
                customName: '',
                customCalories: '',
                customProtein: '',
                customCarbs: '',
                customFat: '',
                customFiber: ''
            });
        }
    };

    const getCustomTotals = () => {
        let calories = 0;
        let protein = 0;
        let carbs = 0;
        let fat = 0;
        let fiber = 0;

        Object.values(customMeals).forEach(items => {
            items.forEach(item => {
                calories += Number(item.calories || 0);
                protein += Number(item.protein || 0);
                carbs += Number(item.carbs || 0);
                fat += Number(item.fat || 0);
                fiber += Number(item.fiber || 0);
            });
        });

        return {
            calories: Math.round(calories),
            protein: Math.round(protein),
            carbs: Math.round(carbs),
            fat: Math.round(fat),
            fiber: Math.round(fiber)
        };
    };

    const customTotals = getCustomTotals();
    const warnings = [];
    if (creationMode === 'manual') {
        if (customTotals.calories < liveMetrics.targetCalories * 0.85) {
            warnings.push(`Calories (${customTotals.calories} kcal) are significantly lower than your recommended target (${liveMetrics.targetCalories} kcal).`);
        }
        if (customTotals.protein < liveMetrics.protein * 0.85) {
            warnings.push(`Protein (${customTotals.protein}g) is lower than your recommended target (${liveMetrics.protein}g).`);
        }
        if (customTotals.fat < liveMetrics.fat * 0.85) {
            warnings.push(`Fat (${customTotals.fat}g) is lower than your recommended target (${liveMetrics.fat}g).`);
        }
        if (customTotals.fiber < liveMetrics.fiber * 0.85) {
            warnings.push(`Fiber (${customTotals.fiber}g) is lower than your recommended target (${liveMetrics.fiber}g).`);
        }
    }

    const handleSaveCustomPlan = async () => {
        setLoading(true);
        setError('');

        try {
            const customPlanDetails = {
                bmi: liveMetrics.bmi,
                tdee: liveMetrics.tdee,
                targetCalories: customTotals.calories,
                waterRequirement: parseFloat((parseFloat(formData.currentWeight) * 0.035).toFixed(1)),
                macros: {
                    protein: customTotals.protein,
                    carbs: customTotals.carbs,
                    fat: customTotals.fat,
                    fiber: customTotals.fiber
                },
                meals: Object.entries(customMeals).map(([name, items]) => ({
                    name,
                    items
                }))
            };

            // Upsert to Supabase
            const { error: upsertError } = await supabase
                .from('dietplans')
                .upsert({
                    user_id: user.id,
                    age: parseInt(formData.age),
                    height: parseFloat(formData.height),
                    current_weight: parseFloat(formData.currentWeight),
                    goal_weight: parseFloat(formData.goalWeight),
                    bmi: customPlanDetails.bmi,
                    target_calories: customPlanDetails.targetCalories,
                    category: formData.goal,
                    style: formData.style,
                    plan_data: customPlanDetails,
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

            navigate('/diet-plan');

        } catch (err) {
            console.error(err);
            setError(err.message || 'An error occurred while saving your custom diet plan.');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Generate diet plan details algorithmically using the preloaded dbFoods
            const payload = {
                ...formData,
                includeWheyProtein: formData.includeWhey,
                includeCreatine: formData.includeCreatine
            };
            const planDetails = generateDietPlan(payload, dbFoods || []);

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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div className="flex items-center space-x-3">
                    <Sparkles className="text-cyber-cyan w-8 h-8 drop-shadow-[0_0_10px_rgba(0,245,255,0.8)] animate-pulse" />
                    <h1 className="text-2xl font-bold font-orbitron neon-text">Diet Plan Generator</h1>
                </div>

                {/* Mode Selector */}
                <div className="flex border border-cyber-blue/20 rounded-lg overflow-hidden bg-[#07070c] p-0.5 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => setCreationMode('auto')}
                        className={`px-4 py-2 text-xs font-orbitron font-semibold tracking-wider uppercase transition-all duration-300 ${
                            creationMode === 'auto'
                                ? 'bg-cyber-blue/15 text-cyber-cyan shadow-[0_0_8px_rgba(0,204,255,0.25)] border-b border-cyber-cyan'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Auto Generate Diet Plan
                    </button>
                    <button
                        type="button"
                        onClick={() => setCreationMode('manual')}
                        className={`px-4 py-2 text-xs font-orbitron font-semibold tracking-wider uppercase transition-all duration-300 ${
                            creationMode === 'manual'
                                ? 'bg-cyber-blue/15 text-cyber-cyan shadow-[0_0_8px_rgba(0,204,255,0.25)] border-b border-cyber-cyan'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Create My Own Diet Plan
                    </button>
                </div>
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

                    {creationMode === 'manual' ? (
                        <div className="cyber-card p-4 space-y-3.5 font-orbitron text-xs">
                            <span className="text-xs text-gray-500 uppercase tracking-widest block text-center border-b border-gray-800 pb-2">Target Comparison</span>
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-gray-400">Calories:</span>
                                        <span className="text-white font-bold">{customTotals.calories} / {liveMetrics.targetCalories} kcal</span>
                                    </div>
                                    <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                                        <div 
                                            className="bg-cyber-blue h-1.5 rounded-full transition-all duration-300"
                                            style={{ width: `${Math.min(100, (customTotals.calories / (liveMetrics.targetCalories || 1)) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-gray-400">Protein:</span>
                                        <span className="text-white font-bold">{customTotals.protein}g / {liveMetrics.protein}g</span>
                                    </div>
                                    <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                                        <div 
                                            className="bg-cyber-cyan h-1.5 rounded-full transition-all duration-300"
                                            style={{ width: `${Math.min(100, (customTotals.protein / (liveMetrics.protein || 1)) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-gray-400">Carbs:</span>
                                        <span className="text-white font-bold">{customTotals.carbs}g / {liveMetrics.carbs}g</span>
                                    </div>
                                    <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                                        <div 
                                            className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
                                            style={{ width: `${Math.min(100, (customTotals.carbs / (liveMetrics.carbs || 1)) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-gray-400">Fat:</span>
                                        <span className="text-white font-bold">{customTotals.fat}g / {liveMetrics.fat}g</span>
                                    </div>
                                    <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                                        <div 
                                            className="bg-cyber-pink h-1.5 rounded-full transition-all duration-300"
                                            style={{ width: `${Math.min(100, (customTotals.fat / (liveMetrics.fat || 1)) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-gray-400">Fiber:</span>
                                        <span className="text-white font-bold">{customTotals.fiber}g / {liveMetrics.fiber}g</span>
                                    </div>
                                    <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                                        <div 
                                            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                                            style={{ width: `${Math.min(100, (customTotals.fiber / (liveMetrics.fiber || 1)) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="cyber-card p-6 flex flex-col items-center justify-center text-center space-y-4">
                            <span className="text-xs text-gray-500 uppercase tracking-widest font-orbitron">Daily Target Calories</span>
                            <div className="text-4xl font-extrabold font-orbitron text-cyber-blue">{liveMetrics.targetCalories} <span className="text-xs text-gray-500">kcal</span></div>
                            <span className="text-[10px] text-gray-400">Estimated TDEE maintenance: {Math.round(liveMetrics.tdee)} kcal</span>
                        </div>
                    )}
                </div>

                {/* Auto Generation Form View */}
                {creationMode === 'auto' && (
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
                )}

                {/* Create My Own Diet Plan Form View */}
                {creationMode === 'manual' && (
                    <div className="md:col-span-2 space-y-6">
                        {/* User Target Parameters form */}
                        <div className="cyber-card p-4 space-y-4 relative overflow-hidden">
                            <h3 className="text-xs font-orbitron text-cyber-blue uppercase tracking-widest border-b border-gray-800 pb-2">Target Calibration Parameters</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-400 uppercase tracking-wide font-orbitron">Gender</label>
                                    <select name="gender" value={formData.gender} onChange={handleChange} className="w-full bg-[#050508] border border-cyber-blue/30 rounded p-2 text-white text-xs focus:outline-none focus:border-cyber-cyan">
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-400 uppercase tracking-wide font-orbitron">Age (Years)</label>
                                    <input type="number" name="age" min="10" max="100" value={formData.age} onChange={handleChange} className="w-full bg-[#050508] border border-cyber-blue/30 rounded p-2 text-white text-xs focus:outline-none focus:border-cyber-cyan font-orbitron" required />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-400 uppercase tracking-wide font-orbitron">Height (cm)</label>
                                    <input type="number" name="height" min="100" max="250" value={formData.height} onChange={handleChange} className="w-full bg-[#050508] border border-cyber-blue/30 rounded p-2 text-white text-xs focus:outline-none focus:border-cyber-cyan font-orbitron" required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-400 uppercase tracking-wide font-orbitron">Weight (kg)</label>
                                    <input type="number" name="currentWeight" min="30" max="250" value={formData.currentWeight} onChange={handleChange} className="w-full bg-[#050508] border border-cyber-blue/30 rounded p-2 text-white text-xs focus:outline-none focus:border-cyber-cyan font-orbitron" required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-400 uppercase tracking-wide font-orbitron">Goal Weight (kg)</label>
                                    <input type="number" name="goalWeight" min="30" max="250" value={formData.goalWeight} onChange={handleChange} className="w-full bg-[#050508] border border-cyber-blue/30 rounded p-2 text-white text-xs focus:outline-none focus:border-cyber-cyan font-orbitron" required />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-400 uppercase tracking-wide font-orbitron">Activity Level</label>
                                    <select name="activityLevel" value={formData.activityLevel} onChange={handleChange} className="w-full bg-[#050508] border border-cyber-blue/30 rounded p-2 text-white text-xs focus:outline-none focus:border-cyber-cyan">
                                        <option value="sedentary">Sedentary</option>
                                        <option value="light">Light Exercise</option>
                                        <option value="moderate">Moderate Exercise</option>
                                        <option value="heavy">Heavy Exercise</option>
                                        <option value="athlete">Athlete</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-400 uppercase tracking-wide font-orbitron">Target Goal</label>
                                    <select name="goal" value={formData.goal} onChange={handleChange} className="w-full bg-[#050508] border border-cyber-blue/30 rounded p-2 text-white text-xs focus:outline-none focus:border-cyber-cyan">
                                        <option value="loss">Weight Loss</option>
                                        <option value="maintenance">Maintenance</option>
                                        <option value="lean">Lean Muscle Gain</option>
                                        <option value="fast">Fast Weight Gain</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Dietary Guidance Alert */}
                        {warnings.length > 0 && (
                            <div className="bg-amber-500/10 border border-amber-500/40 text-amber-400 p-4 rounded-lg text-xs space-y-1">
                                <span className="font-orbitron font-semibold uppercase tracking-wider block mb-1">⚠️ Dietary Guidance Alert</span>
                                {warnings.map((w, idx) => (
                                    <div key={idx}>• {w}</div>
                                ))}
                            </div>
                        )}

                        {/* Meal Builder Sections */}
                        <div className="space-y-4">
                            {mealKeys.map(({ key, name: mealName }) => {
                                const items = customMeals[mealName] || [];
                                const isAdding = addingFood.mealKey === mealName;
                                return (
                                    <div key={key} className="cyber-card p-4 border-cyber-blue/20 bg-[#0f0f15]">
                                        <div className="flex justify-between items-center border-b border-gray-800 pb-2 mb-3">
                                            <h4 className="font-orbitron font-semibold text-sm text-white tracking-wide">{mealName}</h4>
                                            <span className="text-[10px] text-gray-500 font-orbitron">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                                        </div>

                                        {/* List of items already added */}
                                        {items.length > 0 ? (
                                            <div className="space-y-2 mb-3">
                                                {items.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-center bg-[#050508] border border-gray-800 p-2.5 rounded text-xs">
                                                        <div className="flex-1 min-w-0 pr-2">
                                                            <div className="text-gray-300 font-semibold truncate">{item.name}</div>
                                                            <div className="text-[10px] text-gray-500 mt-0.5">
                                                                Cals: {item.calories} | P: {item.protein}g | C: {item.carbs}g | F: {item.fat}g | Fib: {item.fiber}g
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setCustomMeals(prev => ({
                                                                    ...prev,
                                                                    [mealName]: prev[mealName].filter((_, i) => i !== idx)
                                                                }));
                                                            }}
                                                            className="text-red-400 hover:text-red-300 text-[10px] uppercase font-orbitron font-bold tracking-wider hover:underline"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-500 italic mb-3">No foods added to this meal yet.</p>
                                        )}

                                        {/* Add Food Input Panel */}
                                        {isAdding ? (
                                            <div className="bg-[#050508] border border-cyber-blue/20 p-3 rounded space-y-3 animate-fade-in">
                                                {addingFood.isCustom ? (
                                                    // Custom Food Input Panel
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] text-cyber-cyan font-orbitron uppercase tracking-widest block font-bold">New Custom Food</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => setAddingFood(prev => ({ ...prev, isCustom: false }))}
                                                                className="text-[9px] text-gray-400 hover:text-white uppercase font-orbitron font-semibold"
                                                            >
                                                                Back to Search
                                                            </button>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <input
                                                                type="text"
                                                                placeholder="Food Name (e.g. Homemade Protein Pancake)"
                                                                value={addingFood.customName}
                                                                onChange={(e) => setAddingFood(prev => ({ ...prev, customName: e.target.value }))}
                                                                className="w-full bg-[#0a0a0f] border border-gray-700 rounded p-2 text-white text-xs"
                                                            />
                                                            <div className="grid grid-cols-5 gap-1.5">
                                                                <div>
                                                                    <label className="text-[8px] text-gray-500 uppercase block pl-0.5">Cals</label>
                                                                    <input
                                                                        type="number"
                                                                        placeholder="Kcal"
                                                                        value={addingFood.customCalories}
                                                                        onChange={(e) => setAddingFood(prev => ({ ...prev, customCalories: e.target.value }))}
                                                                        className="w-full bg-[#0a0a0f] border border-gray-700 rounded p-1.5 text-white text-center text-xs font-orbitron"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[8px] text-gray-500 uppercase block pl-0.5">Protein</label>
                                                                    <input
                                                                        type="number"
                                                                        placeholder="g"
                                                                        value={addingFood.customProtein}
                                                                        onChange={(e) => setAddingFood(prev => ({ ...prev, customProtein: e.target.value }))}
                                                                        className="w-full bg-[#0a0a0f] border border-gray-700 rounded p-1.5 text-white text-center text-xs font-orbitron"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[8px] text-gray-500 uppercase block pl-0.5">Carbs</label>
                                                                    <input
                                                                        type="number"
                                                                        placeholder="g"
                                                                        value={addingFood.customCarbs}
                                                                        onChange={(e) => setAddingFood(prev => ({ ...prev, customCarbs: e.target.value }))}
                                                                        className="w-full bg-[#0a0a0f] border border-gray-700 rounded p-1.5 text-white text-center text-xs font-orbitron"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[8px] text-gray-500 uppercase block pl-0.5">Fat</label>
                                                                    <input
                                                                        type="number"
                                                                        placeholder="g"
                                                                        value={addingFood.customFat}
                                                                        onChange={(e) => setAddingFood(prev => ({ ...prev, customFat: e.target.value }))}
                                                                        className="w-full bg-[#0a0a0f] border border-gray-700 rounded p-1.5 text-white text-center text-xs font-orbitron"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[8px] text-gray-500 uppercase block pl-0.5">Fiber</label>
                                                                    <input
                                                                        type="number"
                                                                        placeholder="g"
                                                                        value={addingFood.customFiber}
                                                                        onChange={(e) => setAddingFood(prev => ({ ...prev, customFiber: e.target.value }))}
                                                                        className="w-full bg-[#0a0a0f] border border-gray-700 rounded p-1.5 text-white text-center text-xs font-orbitron"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex space-x-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleAddFoodToMeal(mealName)}
                                                                className="flex-1 bg-cyber-blue/15 hover:bg-cyber-blue/30 text-cyber-cyan border border-cyber-cyan/30 py-1.5 rounded text-xs font-orbitron uppercase tracking-wider font-semibold"
                                                            >
                                                                Add Custom Food
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setAddingFood(prev => ({ ...prev, mealKey: null }))}
                                                                className="px-3 bg-transparent border border-gray-800 text-gray-400 hover:text-white rounded text-xs font-orbitron uppercase"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    // DB Food Search Panel
                                                    <div className="space-y-3">
                                                        <div className="relative">
                                                            <input
                                                                type="text"
                                                                placeholder="Search food database..."
                                                                value={addingFood.searchQuery}
                                                                onChange={(e) => handleSearchChange(e.target.value)}
                                                                className="w-full bg-[#0a0a0f] border border-gray-700 rounded p-2 text-white text-xs focus:outline-none focus:border-cyber-blue"
                                                            />
                                                            {addingFood.suggestions.length > 0 && (
                                                                <div className="absolute z-10 w-full bg-[#0a0a0f] border border-gray-800 rounded mt-1 shadow-lg max-h-40 overflow-y-auto">
                                                                    {addingFood.suggestions.map((food) => (
                                                                        <div
                                                                            key={food.id}
                                                                            onClick={() => handleSelectSuggestion(food)}
                                                                            className="p-2 text-xs text-gray-300 hover:bg-cyber-blue/10 hover:text-white cursor-pointer transition-colors text-left"
                                                                        >
                                                                            {food.food_name} <span className="text-[10px] text-gray-500">({food.food_group || food.category})</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {addingFood.selectedFood && (
                                                            <div className="p-2 bg-[#0a0a0f] border border-gray-800 rounded space-y-2">
                                                                <div className="flex justify-between items-center text-xs">
                                                                    <span className="text-gray-400 font-semibold">{addingFood.selectedFood.food_name}</span>
                                                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-orbitron">Base serving: 100g/ml or 1pc</span>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <input
                                                                        type="number"
                                                                        placeholder={`Enter quantity in ${getUnit(addingFood.selectedFood)}`}
                                                                        value={addingFood.quantity}
                                                                        onChange={(e) => setAddingFood(prev => ({ ...prev, quantity: e.target.value }))}
                                                                        className="flex-1 bg-[#050508] border border-gray-700 rounded p-2 text-white text-xs font-orbitron"
                                                                    />
                                                                    <span className="text-xs text-gray-405 font-orbitron">{getUnit(addingFood.selectedFood)}</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="flex justify-between items-center pt-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => setAddingFood(prev => ({ ...prev, isCustom: true }))}
                                                                className="text-[9px] text-cyber-blue hover:text-cyber-cyan uppercase font-orbitron font-semibold tracking-wider hover:underline"
                                                            >
                                                                Create Custom Food
                                                            </button>
                                                            <div className="flex space-x-2">
                                                                <button
                                                                    type="button"
                                                                    disabled={!addingFood.selectedFood || !addingFood.quantity}
                                                                    onClick={() => handleAddFoodToMeal(mealName)}
                                                                    className="bg-cyber-cyan/15 hover:bg-cyber-cyan/30 text-cyber-cyan border border-cyber-cyan/30 py-1.5 px-3 rounded text-xs font-orbitron uppercase tracking-wider font-semibold disabled:opacity-40 disabled:pointer-events-none"
                                                                >
                                                                    Add Food
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setAddingFood(prev => ({ ...prev, mealKey: null }))}
                                                                    className="px-3 bg-transparent border border-gray-800 text-gray-400 hover:text-white rounded text-xs font-orbitron uppercase"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setAddingFood(prev => ({
                                                    ...prev,
                                                    mealKey: mealName,
                                                    isCustom: false,
                                                    searchQuery: '',
                                                    suggestions: [],
                                                    selectedFood: null,
                                                    quantity: ''
                                                }))}
                                                className="text-xs text-cyber-cyan font-orbitron uppercase tracking-widest hover:underline font-bold"
                                            >
                                                + Add Food
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            type="button"
                            disabled={loading}
                            onClick={handleSaveCustomPlan}
                            className="cyber-button w-full mt-8 py-4 text-lg"
                        >
                            {loading ? (
                                <><Loader2 className="animate-spin mr-2" /> SAVING PROTOCOL...</>
                            ) : (
                                'SAVE CUSTOM DIET PLAN'
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
