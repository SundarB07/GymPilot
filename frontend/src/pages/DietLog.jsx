import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Apple, Plus, Loader2, Info, BarChart2, ListCollapse, Trash2 } from 'lucide-react';

export default function DietLog() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('logs'); // 'logs' or 'analytics'
    const [analyticsRange, setAnalyticsRange] = useState('weekly'); // 'daily', 'weekly', 'monthly'

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState('');

    // Today's logs
    const [logs, setLogs] = useState([]);
    // Historical logs for analytics
    const [historicalLogs, setHistoricalLogs] = useState([]);
    const [activePlan, setActivePlan] = useState(null);

    // Form inputs
    const [mealType, setMealType] = useState('Breakfast');
    const [foodItems, setFoodItems] = useState('');
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [carbs, setCarbs] = useState('');
    const [fat, setFat] = useState('');
    const [fiber, setFiber] = useState('');
    const [wheyTaken, setWheyTaken] = useState(false);
    const [wheyGrams, setWheyGrams] = useState('');
    const [creatineTaken, setCreatineTaken] = useState(false);
    const [creatineGrams, setCreatineGrams] = useState('');

    // Planned foods and database auto-complete states
    const [plannedFoods, setPlannedFoods] = useState([]);
    const [checkedFoods, setCheckedFoods] = useState({});
    const [dbFoods, setDbFoods] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);

    const [prevMealType, setPrevMealType] = useState('Breakfast');
    const [prevPlanId, setPrevPlanId] = useState(null);

    // States for custom food quantity prompts
    const [showAddExtra, setShowAddExtra] = useState(false);
    const [selectedDbFood, setSelectedDbFood] = useState(null);
    const [quantity, setQuantity] = useState('');
    const [showConsumed, setShowConsumed] = useState(false);

    // Reset extra food states when meal type changes
    useEffect(() => {
        setFoodItems('');
        setCalories('');
        setProtein('');
        setCarbs('');
        setFat('');
        setFiber('');
        setQuantity('');
        setSelectedDbFood(null);
        setShowAddExtra(false);
    }, [mealType]);

    useEffect(() => {
        if (user) {
            fetchLogs();
            fetchActiveDietPlan();
            fetchHistoricalLogs();
            fetchDbFoods();
        }
    }, [user]);

    async function fetchDbFoods() {
        const { data } = await supabase.from('foods').select('*');
        if (data) setDbFoods(data);
    }

    const isFoodConsumedToday = (itemName, currentMealType) => {
        const logsForMeal = logs.filter(log => {
            const logMeal = (log.meal_type || '').toLowerCase().replace('-', ' ');
            const targetMeal = currentMealType.toLowerCase().replace('-', ' ');
            return logMeal === targetMeal;
        });

        return logsForMeal.some(log => {
            const itemsList = (log.food_items || '').split(',').map(s => s.trim().toLowerCase());
            return itemsList.some(loggedItem => {
                const cleanItem = itemName.toLowerCase().trim();
                return loggedItem === cleanItem || loggedItem.includes(cleanItem) || cleanItem.includes(loggedItem);
            });
        });
    };

    useEffect(() => {
        if (!activePlan) {
            setPlannedFoods([]);
            setCheckedFoods({});
            setPrevMealType(mealType);
            setPrevPlanId(activePlan?.id || null);
            return;
        }
        const selectedMealObj = activePlan.plan_data?.meals?.find(m => {
            const cleanMealName = m.name.toLowerCase();
            const cleanSelected = mealType.toLowerCase().replace('-', ' ');
            return cleanMealName.includes(cleanSelected) || cleanSelected.includes(cleanMealName);
        });
        const items = selectedMealObj?.items || [];
        setPlannedFoods(items);

        const initialChecked = {};
        items.forEach((item, idx) => {
            const consumed = isFoodConsumedToday(item.name, mealType);
            initialChecked[idx] = !consumed;
        });
        setCheckedFoods(initialChecked);
        
        setPrevMealType(mealType);
        setPrevPlanId(activePlan.id);
    }, [mealType, activePlan, logs]);

    async function fetchActiveDietPlan() {
        try {
            const { data } = await supabase
                .from('dietplans')
                .select('*')
                .eq('user_id', user.id)
                .single();
            if (data) {
                setActivePlan(prev => {
                    if (prev && prev.id === data.id && prev.updated_at === data.updated_at) {
                        return prev;
                    }
                    return data;
                });
            }
        } catch (err) {
            console.error('Error fetching diet plan:', err);
        }
    }

    async function fetchLogs() {
        try {
            const { data, error } = await supabase
                .from('dietlogs')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', new Date().toISOString().split('T')[0])
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setLogs(data);
        } catch (err) {
            console.error(err);
        } finally {
            setFetching(false);
        }
    }

    async function fetchHistoricalLogs() {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data, error } = await supabase
                .from('dietlogs')
                .select('*')
                .eq('user_id', user.id)
                .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
                .order('date', { ascending: true });

            if (error) throw error;
            if (data) setHistoricalLogs(data);
        } catch (err) {
            console.error('Error fetching historical logs:', err);
        }
    }

    const getPlannedTotals = () => {
        let cals = 0, prot = 0, carb = 0, ft = 0, fib = 0;
        plannedFoods.forEach((item, idx) => {
            if (checkedFoods[idx]) {
                cals += Number(item.calories || 0);
                prot += Number(item.protein || 0);
                carb += Number(item.carbs || 0);
                ft += Number(item.fat || 0);
                fib += Number(item.fiber || 0);
            }
        });
        return { calories: cals, protein: prot, carbs: carb, fat: ft, fiber: fib };
    };

    const handleSearchChange = (query) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setSuggestions([]);
            return;
        }
        const filtered = dbFoods.filter(f => 
            f.food_name.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);
        setSuggestions(filtered);
    };

    const getFoodUnitAndServing = (food) => {
        if (!food) return { unit: 'g', dbServing: 100, promptText: 'Enter grams' };
        const name = food.food_name.toLowerCase();
        const cat = (food.category || '').toLowerCase();

        if (name.includes('egg white')) {
            return { unit: 'egg whites', dbServing: 100 / 33, promptText: 'Enter number of egg whites' };
        }
        if (name.includes('egg')) {
            return { unit: 'eggs', dbServing: 2, promptText: 'Enter number of eggs' };
        }
        if (name.includes('banana') || name.includes('apple') || name.includes('chapati') || name.includes('roti') || name.includes('idli') || name.includes('dosa') || name.includes('appam')) {
            let label = 'pieces';
            if (name.includes('banana')) label = 'bananas';
            else if (name.includes('apple')) label = 'apples';
            else if (name.includes('chapati') || name.includes('roti')) label = 'chapatis';
            else if (name.includes('idli')) label = 'idlis';
            else if (name.includes('dosa')) label = 'dosas';
            else if (name.includes('appam')) label = 'appams';
            
            return { unit: label, dbServing: 1, promptText: `Enter number of ${label}` };
        }
        if (cat === 'drink' || name.includes('milk') || name.includes('buttermilk')) {
            return { unit: 'ml', dbServing: 100, promptText: 'Enter ml' };
        }
        return { unit: 'g', dbServing: 100, promptText: 'Enter grams' };
    };

    const handleQuantityChange = (val) => {
        setQuantity(val);
        if (!selectedDbFood) return;
        const qty = parseFloat(val);
        if (!qty || isNaN(qty)) {
            setCalories('');
            setProtein('');
            setCarbs('');
            setFat('');
            setFiber('');
            return;
        }
        const { dbServing } = getFoodUnitAndServing(selectedDbFood);
        const scale = qty / dbServing;
        
        setCalories(Math.round(Number(selectedDbFood.calories_kcal) * scale));
        setProtein(Math.round(Number(selectedDbFood.protein_g) * scale));
        setCarbs(Math.round(Number(selectedDbFood.carbs_g) * scale));
        setFat(Math.round(Number(selectedDbFood.fat_g) * scale));
        setFiber(Math.round(Number(selectedDbFood.fiber_g || 0) * scale));
    };

    const selectSuggestion = (food) => {
        setSelectedDbFood(food);
        setSearchQuery('');
        setSuggestions([]);
    };

    // Format foodItems text dynamically when database food selection and quantity change
    useEffect(() => {
        if (selectedDbFood) {
            const { unit } = getFoodUnitAndServing(selectedDbFood);
            const qtyStr = quantity ? `${quantity}${unit === 'g' || unit === 'ml' ? '' : ' '}${unit}` : '';
            setFoodItems([qtyStr, selectedDbFood.food_name].filter(Boolean).join(' '));
        }
    }, [selectedDbFood, quantity]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const plannedTotals = getPlannedTotals();
            const activePlannedNames = plannedFoods.filter((_, idx) => checkedFoods[idx]).map(item => item.name).join(', ');
            
            const finalFoodItems = [activePlannedNames, foodItems].filter(Boolean).join(', ');
            
            if (!finalFoodItems.trim()) {
                throw new Error("Please select at least one planned food or log custom food items.");
            }

            const finalCalories = plannedTotals.calories + (parseFloat(calories) || 0);
            const finalProtein = plannedTotals.protein + (parseFloat(protein) || 0);
            const finalCarbs = plannedTotals.carbs + (parseFloat(carbs) || 0);
            const finalFat = plannedTotals.fat + (parseFloat(fat) || 0);
            const finalFiber = plannedTotals.fiber + (parseFloat(fiber) || 0);

            const { error: insertError } = await supabase
                .from('dietlogs')
                .insert([{
                    user_id: user.id,
                    date: new Date().toISOString().split('T')[0],
                    meal_type: mealType,
                    food_items: finalFoodItems,
                    calories: parseFloat(finalCalories) || 0,
                    protein: parseFloat(finalProtein) || 0,
                    carbs: parseFloat(finalCarbs) || 0,
                    fat: parseFloat(finalFat) || 0,
                    fiber: parseFloat(finalFiber) || 0,
                    whey_taken: wheyTaken,
                    whey_grams: wheyTaken ? (parseFloat(wheyGrams) || 0) : 0,
                    creatine_taken: creatineTaken,
                    creatine_grams: creatineTaken ? (parseFloat(creatineGrams) || 0) : 0,
                }]);

            if (insertError) throw insertError;

            // Reset inputs
            setFoodItems('');
            setCalories('');
            setProtein('');
            setCarbs('');
            setFat('');
            setFiber('');
            setWheyTaken(false);
            setWheyGrams('');
            setCreatineTaken(false);
            setCreatineGrams('');
            setQuantity('');
            setSelectedDbFood(null);
            setShowAddExtra(false);

            // Refresh logs
            fetchLogs();
            fetchHistoricalLogs();
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to log meal.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteLog = async (logId) => {
        if (!window.confirm("Are you sure you want to delete this log entry?")) return;
        try {
            const { error: deleteError } = await supabase
                .from('dietlogs')
                .delete()
                .eq('id', logId);
            if (deleteError) throw deleteError;
            
            fetchLogs();
            fetchHistoricalLogs();
        } catch (err) {
            console.error('Error deleting log:', err);
            alert('Failed to delete log entry.');
        }
    };

    // Calculate Today's Totals
    const totalCalories = logs.reduce((sum, log) => sum + Number(log.calories || 0), 0);
    // Whey Protein usually contains 80% protein
    const totalProtein = logs.reduce((sum, log) => sum + Number(log.protein || 0) + (log.whey_taken ? (Number(log.whey_grams || 0) * 0.8) : 0), 0);
    const totalCarbs = logs.reduce((sum, log) => sum + Number(log.carbs || 0), 0);
    const totalFat = logs.reduce((sum, log) => sum + Number(log.fat || 0), 0);
    const totalFiber = logs.reduce((sum, log) => sum + Number(log.fiber || 0), 0);
    const totalCreatine = logs.reduce((sum, log) => sum + (log.creatine_taken ? Number(log.creatine_grams || 0) : 0), 0);

    // Group logs for analytics
    const getGroupedData = () => {
        const days = analyticsRange === 'weekly' ? 7 : 30;
        const result = [];

        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dateLabel = d.toLocaleDateString([], { month: 'short', day: 'numeric' });

            const logsForDay = historicalLogs.filter(log => log.date === dateStr);
            const cals = logsForDay.reduce((sum, log) => sum + Number(log.calories || 0), 0);
            const prot = logsForDay.reduce((sum, log) => sum + Number(log.protein || 0) + (log.whey_taken ? (Number(log.whey_grams || 0) * 0.8) : 0), 0);
            const cb = logsForDay.reduce((sum, log) => sum + Number(log.carbs || 0), 0);
            const f = logsForDay.reduce((sum, log) => sum + Number(log.fat || 0), 0);
            const fib = logsForDay.reduce((sum, log) => sum + Number(log.fiber || 0), 0);

            result.push({
                date: dateStr,
                label: dateLabel,
                calories: cals,
                protein: prot,
                carbs: cb,
                fat: f,
                fiber: fib
            });
        }
        return result;
    };

    const groupedData = getGroupedData();
    const maxCaloriesInGroup = Math.max(...groupedData.map(d => d.calories), 1);
    const targetCals = activePlan ? Number(activePlan.target_calories) : 2000;
    const maxChartHeight = Math.max(maxCaloriesInGroup, targetCals) * 1.15;

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header & Tabs */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0 mb-4">
                <div className="flex items-center space-x-3">
                    <Apple className="text-purple-400 w-8 h-8 drop-shadow-[0_0_10px_rgba(183,108,253,0.8)]" />
                    <h1 className="text-2xl font-bold font-orbitron neon-text">Nutritional Telemetry</h1>
                </div>

                <div className="flex bg-[#050508] border border-gray-800 rounded-lg p-1 max-w-max self-start sm:self-auto">
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded text-xs font-orbitron font-semibold tracking-wide transition-all ${activeTab === 'logs' ? 'bg-cyber-blue/10 text-cyber-cyan border border-cyber-cyan/30 shadow-[0_0_10px_rgba(0,245,255,0.1)]' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <ListCollapse size={14} />
                        <span>Intake Logs</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded text-xs font-orbitron font-semibold tracking-wide transition-all ${activeTab === 'analytics' ? 'bg-cyber-blue/10 text-cyber-cyan border border-cyber-cyan/30 shadow-[0_0_10px_rgba(0,245,255,0.1)]' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <BarChart2 size={14} />
                        <span>Macro Analytics</span>
                    </button>
                </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="cyber-card p-4 text-center">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-orbitron block mb-1">Calories Consumed</span>
                    <span className="font-orbitron text-xl text-white">{totalCalories}<span className="text-xs text-gray-500 ml-0.5">kcal</span></span>
                    {activePlan && (
                        <span className="text-[9px] text-gray-500 block mt-1">Target: {activePlan.target_calories} kcal</span>
                    )}
                </div>
                <div className="cyber-card p-4 text-center">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-orbitron block mb-1">Total Protein</span>
                    <span className="font-orbitron text-xl text-cyber-cyan">{Math.round(totalProtein)}g</span>
                    {activePlan && (
                        <span className="text-[9px] text-gray-500 block mt-1">Target: {activePlan.plan_data.macros.protein}g</span>
                    )}
                </div>
                <div className="cyber-card p-4 text-center">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-orbitron block mb-1">Carbs / Fats</span>
                    <span className="font-orbitron text-sm text-cyber-blue">{totalCarbs}g <span className="text-gray-600">/</span> <span className="text-cyber-pink">{totalFat}g</span></span>
                    {activePlan && (
                        <span className="text-[9px] text-gray-500 block mt-1">Target: {activePlan.plan_data.macros.carbs}g / {activePlan.plan_data.macros.fat}g</span>
                    )}
                </div>
                <div className="cyber-card p-4 text-center">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-orbitron block mb-1">Fiber / Creatine</span>
                    <span className="font-orbitron text-sm text-purple-400">{totalFiber}g <span className="text-gray-600">/</span> <span className="text-cyber-blue">{totalCreatine}g</span></span>
                    {activePlan && (
                        <span className="text-[9px] text-gray-500 block mt-1">Target Fiber: {activePlan.plan_data.macros.fiber}g</span>
                    )}
                </div>
            </div>

            {activeTab === 'logs' ? (
                <>
                    {/* Log Fuel Form */}
                    <form onSubmit={handleSubmit} className="cyber-card space-y-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 blur-2xl rounded-full"></div>
                        <h2 className="font-orbitron text-md text-white mb-2 relative z-10">Log Fuel Intake</h2>

                        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-2 rounded text-xs">{error}</div>}

                        <div className="grid grid-cols-1 gap-3 relative z-10">
                            <div>
                                <label className="text-[10px] text-gray-400 uppercase tracking-wide ml-1">Meal Type</label>
                                <select
                                    value={mealType}
                                    onChange={(e) => setMealType(e.target.value)}
                                    className="w-full bg-[#050508] border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-purple-400 text-sm mt-1"
                                >
                                    <option value="Breakfast">Breakfast</option>
                                    <option value="Lunch">Lunch</option>
                                    <option value="Dinner">Dinner</option>
                                    <option value="Snack">Snack</option>
                                    <option value="Pre Workout">Pre Workout</option>
                                    <option value="Post Workout">Post Workout</option>
                                </select>
                            </div>
                        </div>

                        {/* Planned Foods Checklist */}
                        {(() => {
                            const itemsWithStatus = plannedFoods.map((item, idx) => {
                                const consumed = isFoodConsumedToday(item.name, mealType);
                                return { item, idx, consumed };
                            });
                            const pendingItems = itemsWithStatus.filter(x => !x.consumed);

                            if (plannedFoods.length === 0) return null;

                            return (
                                <div className="bg-[#050508] border border-gray-800 p-4 rounded-lg space-y-3 relative z-10">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] text-cyber-cyan uppercase font-orbitron tracking-wider block">Planned Foods</span>
                                        <label className="flex items-center space-x-1.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={showConsumed}
                                                onChange={() => setShowConsumed(!showConsumed)}
                                                className="w-3.5 h-3.5 rounded border border-gray-700 bg-[#050508] checked:bg-cyber-cyan checked:border-cyber-cyan appearance-none cursor-pointer relative checked:before:content-['✓'] checked:before:absolute checked:before:text-black checked:before:text-[9px] checked:before:font-bold checked:before:flex checked:before:items-center checked:before:justify-center checked:before:inset-0 transition-all"
                                            />
                                            <span className="text-[9px] text-gray-400 font-orbitron uppercase select-none">Show Consumed Foods</span>
                                        </label>
                                    </div>

                                    {pendingItems.length === 0 && (
                                        <div className="text-center p-4 border border-dashed border-green-500/30 bg-green-500/5 rounded text-green-400 font-semibold font-orbitron text-xs tracking-wider">
                                            {mealType} Completed ✅
                                        </div>
                                    )}

                                    {(pendingItems.length > 0 || showConsumed) && (
                                        <div className="space-y-2">
                                            {itemsWithStatus.map(({ item, idx, consumed }) => {
                                                if (consumed && !showConsumed) return null;

                                                return (
                                                    <label key={idx} className={`flex items-center justify-between p-2 rounded bg-gray-900/40 border transition-all cursor-pointer ${consumed ? 'border-gray-800/20 opacity-40' : 'border-gray-800/60 hover:border-gray-700/50'}`}>
                                                        <div className="flex items-center space-x-2">
                                                            {consumed ? (
                                                                <div className="w-4 h-4 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center text-green-400 text-[9px] font-bold">
                                                                    ✓
                                                                </div>
                                                            ) : (
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!checkedFoods[idx]}
                                                                    onChange={() => setCheckedFoods({ ...checkedFoods, [idx]: !checkedFoods[idx] })}
                                                                    className="w-4 h-4 rounded border border-gray-700 bg-[#050508] checked:bg-cyber-cyan checked:border-cyber-cyan appearance-none cursor-pointer relative checked:before:content-['✓'] checked:before:absolute checked:before:text-black checked:before:text-[10px] checked:before:font-bold checked:before:flex checked:before:items-center checked:before:justify-center checked:before:inset-0 transition-all"
                                                                />
                                                            )}
                                                            <span className={`text-sm font-semibold ${consumed ? 'text-gray-500 line-through' : 'text-white'}`}>{item.name}</span>
                                                        </div>
                                                        <span className="text-xs text-gray-500 font-orbitron">
                                                            {item.calories} kcal | P: {item.protein}g | C: {item.carbs}g | F: {item.fat}g
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {!showAddExtra && (
                                        <button
                                            type="button"
                                            onClick={() => setShowAddExtra(true)}
                                            className="w-full mt-2 py-2 border border-dashed border-cyber-cyan/30 hover:border-cyber-cyan/60 rounded bg-cyber-cyan/5 hover:bg-cyber-cyan/10 text-cyber-cyan text-xs font-orbitron uppercase transition-all tracking-wider flex items-center justify-center cursor-pointer"
                                        >
                                            <Plus className="mr-1.5 w-3.5 h-3.5" />
                                            Add Other Food
                                        </button>
                                    )}
                                </div>
                            );
                        })()}

                        {plannedFoods.length === 0 && (
                            <div className="bg-[#050508] border border-gray-800/40 p-4 rounded-lg space-y-2 relative z-10 text-center">
                                <p className="text-xs text-gray-500 italic">No planned foods found in your current diet plan for {mealType}.</p>
                                {!showAddExtra && (
                                    <button
                                        type="button"
                                        onClick={() => setShowAddExtra(true)}
                                        className="mx-auto py-2 px-4 border border-dashed border-cyber-cyan/30 hover:border-cyber-cyan/60 rounded bg-cyber-cyan/5 hover:bg-cyber-cyan/10 text-cyber-cyan text-xs font-orbitron uppercase transition-all tracking-wider flex items-center justify-center cursor-pointer"
                                    >
                                        <Plus className="mr-1.5 w-3.5 h-3.5" />
                                        Add Other Food
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Custom / Extra Food Autocomplete & Inputs */}
                        {showAddExtra && (
                            <div className="space-y-4 p-4 rounded-lg border border-gray-800/60 bg-[#0a0a0f] relative z-10">
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-orbitron block">
                                    Add Other Food
                                </span>

                                {!selectedDbFood ? (
                                    <>
                                        {/* Autocomplete Search Bar */}
                                        <div className="relative">
                                            <label className="text-[9px] text-gray-500 uppercase tracking-wider block mb-1">Search Food Database</label>
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => handleSearchChange(e.target.value)}
                                                placeholder="🔍 Search food database (e.g. Oats, Egg, Paneer...)"
                                                className="w-full bg-[#050508] border border-gray-700/50 focus:border-purple-400 rounded p-2 text-white text-xs"
                                            />
                                            {suggestions.length > 0 && (
                                                <div className="absolute left-0 right-0 mt-1 bg-[#09090f] border border-gray-800 rounded shadow-xl z-30 max-h-48 overflow-y-auto divide-y divide-gray-900">
                                                    {suggestions.map((food) => (
                                                        <button
                                                            key={food.id}
                                                            type="button"
                                                            onClick={() => selectSuggestion(food)}
                                                            className="w-full text-left p-2 hover:bg-cyber-blue/10 transition-colors flex justify-between items-center text-xs text-gray-300 cursor-pointer"
                                                        >
                                                            <span>{food.food_name}</span>
                                                            <span className="text-[10px] text-gray-500 font-orbitron">{food.calories_kcal} kcal / 100g</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Manual / Fallback Entry */}
                                        <div className="grid grid-cols-1 gap-2 pt-2 border-t border-gray-900">
                                            <span className="text-[9px] text-gray-500 uppercase tracking-wider block">Or Enter Custom Food Name</span>
                                            <div>
                                                <input
                                                    type="text"
                                                    value={foodItems}
                                                    onChange={(e) => setFoodItems(e.target.value)}
                                                    placeholder="e.g. Custom Protein Shake"
                                                    className="w-full bg-[#050508] border border-gray-750 focus:border-purple-400 rounded p-2 text-white text-xs mt-1"
                                                />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="bg-[#050508] border border-gray-800 p-3 rounded space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-semibold text-cyber-cyan">{selectedDbFood.food_name}</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedDbFood(null);
                                                    setQuantity('');
                                                    setFoodItems('');
                                                    setCalories('');
                                                    setProtein('');
                                                    setCarbs('');
                                                    setFat('');
                                                    setFiber('');
                                                }}
                                                className="text-[10px] text-red-400 hover:text-red-300 font-orbitron uppercase border border-red-500/20 px-2 py-0.5 rounded cursor-pointer"
                                            >
                                                Clear Selection
                                            </button>
                                        </div>

                                        {/* Quantity input */}
                                        <div>
                                            <label className="text-[9px] text-gray-400 uppercase tracking-wider block mb-1">
                                                {getFoodUnitAndServing(selectedDbFood).promptText}
                                            </label>
                                            <input
                                                type="number"
                                                value={quantity}
                                                onChange={(e) => handleQuantityChange(e.target.value)}
                                                placeholder={`e.g. ${getFoodUnitAndServing(selectedDbFood).unit === 'g' ? '150' : getFoodUnitAndServing(selectedDbFood).unit === 'ml' ? '250' : '2'}`}
                                                className="w-full bg-[#050508] border border-gray-750 focus:border-purple-400 rounded p-2 text-white text-xs"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Nutrition Matrix (Read-only if DB food, editable if manual fallback) */}
                                <div className="grid grid-cols-5 gap-2 pt-2 border-t border-gray-900">
                                    <div>
                                        <label className="text-[9px] text-gray-550 uppercase tracking-wider block">Calories</label>
                                        <input
                                            type="number"
                                            value={calories}
                                            onChange={(e) => !selectedDbFood && setCalories(e.target.value)}
                                            readOnly={!!selectedDbFood}
                                            placeholder="kcal"
                                            className={`w-full bg-[#050508] border border-gray-750 rounded p-2 text-white text-xs mt-1 focus:border-purple-400 ${selectedDbFood ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] text-gray-550 uppercase tracking-wider block">Protein (g)</label>
                                        <input
                                            type="number"
                                            value={protein}
                                            onChange={(e) => !selectedDbFood && setProtein(e.target.value)}
                                            readOnly={!!selectedDbFood}
                                            placeholder="g"
                                            className={`w-full bg-[#050508] border border-gray-750 rounded p-2 text-white text-xs mt-1 focus:border-purple-400 ${selectedDbFood ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] text-gray-550 uppercase tracking-wider block">Carbs (g)</label>
                                        <input
                                            type="number"
                                            value={carbs}
                                            onChange={(e) => !selectedDbFood && setCarbs(e.target.value)}
                                            readOnly={!!selectedDbFood}
                                            placeholder="g"
                                            className={`w-full bg-[#050508] border border-gray-750 rounded p-2 text-white text-xs mt-1 focus:border-purple-400 ${selectedDbFood ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] text-gray-550 uppercase tracking-wider block">Fats (g)</label>
                                        <input
                                            type="number"
                                            value={fat}
                                            onChange={(e) => !selectedDbFood && setFat(e.target.value)}
                                            readOnly={!!selectedDbFood}
                                            placeholder="g"
                                            className={`w-full bg-[#050508] border border-gray-750 rounded p-2 text-white text-xs mt-1 focus:border-purple-400 ${selectedDbFood ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] text-gray-550 uppercase tracking-wider block">Fiber (g)</label>
                                        <input
                                            type="number"
                                            value={fiber}
                                            onChange={(e) => !selectedDbFood && setFiber(e.target.value)}
                                            readOnly={!!selectedDbFood}
                                            placeholder="g"
                                            className={`w-full bg-[#050508] border border-gray-750 rounded p-2 text-white text-xs mt-1 focus:border-purple-400 ${selectedDbFood ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Supplement Add-ons */}
                        <div className="p-3 rounded border border-gray-800 bg-[#0a0a0f] space-y-3 relative z-10">
                            <div className="flex items-center justify-between">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={wheyTaken}
                                        onChange={() => setWheyTaken(!wheyTaken)}
                                        className="w-4 h-4 accent-cyber-blue"
                                    />
                                    <span className="text-xs text-gray-300">Whey Protein Added (+80% protein yield)</span>
                                </label>
                                {wheyTaken && (
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="number"
                                            value={wheyGrams}
                                            onChange={(e) => setWheyGrams(e.target.value)}
                                            placeholder="Grams"
                                            className="w-16 bg-black border border-gray-700 rounded p-1 text-white text-xs text-center focus:border-cyber-blue"
                                            required={wheyTaken}
                                        />
                                        <span className="text-xs text-gray-500">g</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between border-t border-gray-800/60 pt-3">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={creatineTaken}
                                        onChange={() => setCreatineTaken(!creatineTaken)}
                                        className="w-4 h-4 accent-cyber-blue"
                                    />
                                    <span className="text-xs text-gray-300">Creatine Load</span>
                                </label>
                                {creatineTaken && (
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="number"
                                            value={creatineGrams}
                                            onChange={(e) => setCreatineGrams(e.target.value)}
                                            placeholder="Grams"
                                            className="w-16 bg-black border border-gray-700 rounded p-1 text-white text-xs text-center focus:border-cyber-blue"
                                            required={creatineTaken}
                                        />
                                        <span className="text-xs text-gray-500">g</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button disabled={loading} type="submit" className="w-full bg-purple-500 hover:bg-purple-400 text-white font-orbitron py-2.5 rounded shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all flex justify-center items-center text-xs tracking-widest relative z-10">
                            {loading ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : <Plus className="mr-2 w-4 h-4" />}
                            LOG INTAKE PROTOCOL
                        </button>
                    </form>

                    {/* Today's Logs */}
                    <div className="mt-6">
                        <h3 className="font-orbitron text-xs text-gray-400 mb-4 tracking-widest uppercase">Today's Logs</h3>

                        {fetching ? (
                            <div className="flex justify-center p-4"><Loader2 className="animate-spin text-purple-400" /></div>
                        ) : logs.length === 0 ? (
                            <div className="text-center p-6 border border-dashed border-gray-800 rounded-xl">
                                <Info className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                                <p className="text-xs text-gray-500 tracking-wide">No telemetry recorded today.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {logs.map((log) => (
                                    <div key={log.id} className="cyber-card p-4 border border-purple-900/30 hover:border-purple-500/30">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold text-cyber-cyan bg-cyber-blue/5 border border-cyber-cyan/20 px-2 py-0.5 rounded">{log.meal_type}</span>
                                            <div className="flex items-center space-x-3">
                                                <span className="text-[10px] text-gray-500 font-orbitron">
                                                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <button
                                                    onClick={() => handleDeleteLog(log.id)}
                                                    className="text-gray-500 hover:text-red-400 p-0.5 rounded hover:bg-red-500/10 transition-all cursor-pointer"
                                                    title="Delete this log item"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-gray-200 text-sm mb-3">{log.food_items}</p>

                                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 border-t border-gray-800/60 pt-3 text-center">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] text-gray-500 uppercase tracking-widest leading-none mb-1">Calories</span>
                                                <span className="text-xs text-white font-orbitron font-semibold">{log.calories || 0} kcal</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[8px] text-gray-500 uppercase tracking-widest leading-none mb-1">Protein</span>
                                                <span className="text-xs text-cyber-cyan font-orbitron font-semibold">{log.protein || 0}g</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[8px] text-gray-500 uppercase tracking-widest leading-none mb-1">Carbs</span>
                                                <span className="text-xs text-cyber-blue font-orbitron font-semibold">{log.carbs || 0}g</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[8px] text-gray-500 uppercase tracking-widest leading-none mb-1">Fats</span>
                                                <span className="text-xs text-cyber-pink font-orbitron font-semibold">{log.fat || 0}g</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[8px] text-gray-500 uppercase tracking-widest leading-none mb-1">Fiber</span>
                                                <span className="text-xs text-purple-400 font-orbitron font-semibold">{log.fiber || 0}g</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                /* Analytics Dashboard Tab */
                <div className="cyber-card space-y-6">
                    <div className="flex justify-between items-center border-b border-gray-800 pb-3 mb-4">
                        <h3 className="font-orbitron text-sm text-white tracking-widest uppercase">Trend Analysis</h3>
                        <div className="flex space-x-2 bg-[#050508] border border-gray-800 rounded p-1">
                            <button
                                onClick={() => setAnalyticsRange('weekly')}
                                className={`text-[10px] px-2.5 py-1 rounded font-semibold font-orbitron transition-all ${analyticsRange === 'weekly' ? 'bg-cyber-cyan text-black' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                Past 7 Days
                            </button>
                            <button
                                onClick={() => setAnalyticsRange('monthly')}
                                className={`text-[10px] px-2.5 py-1 rounded font-semibold font-orbitron transition-all ${analyticsRange === 'monthly' ? 'bg-cyber-cyan text-black' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                Past 30 Days
                            </button>
                        </div>
                    </div>

                    {/* Chart Container (SVG-based Bar Chart) */}
                    <div className="space-y-4 overflow-x-auto pb-2 scrollbar-thin">
                        <div
                            className="h-48 flex items-end justify-between border-b border-gray-850 pb-2 pt-4 relative"
                            style={{ 
                                minWidth: analyticsRange === 'monthly' ? '1200px' : '100%',
                                width: '100%'
                            }}
                        >
                            {/* Target Guideline */}
                            {activePlan && (
                                <div
                                    className="absolute left-0 w-full border-t border-dashed border-red-500/50 z-10 flex items-center justify-end pr-2"
                                    style={{
                                        bottom: `${(targetCals / maxChartHeight) * 100}%`
                                    }}
                                >
                                    <span className="text-[8px] text-red-400 font-orbitron bg-cyber-bg px-1 rounded -translate-y-1/2">Target: {targetCals} kcal</span>
                                </div>
                            )}

                            {/* Bars */}
                            {groupedData.map((d, index) => {
                                const heightPercent = (d.calories / maxChartHeight) * 100;
                                return (
                                    <div key={index} className="flex-1 flex flex-col items-center group relative mx-0.5 sm:mx-1">
                                        {/* Hover details tooltip */}
                                        <div className="absolute bottom-full mb-1 bg-[#09090f] border border-gray-800 text-[9px] rounded p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none text-center shadow-lg font-orbitron whitespace-nowrap">
                                            <div className="text-white font-bold">{d.label}</div>
                                            <div className="text-cyber-cyan">{d.calories} kcal</div>
                                            <div className="text-cyber-blue">P: {Math.round(d.protein)}g | C: {d.carbs}g</div>
                                        </div>

                                        {/* Calorie fill bar */}
                                        <div
                                            className="w-full bg-cyber-blue/10 border border-cyber-blue/40 rounded-t-sm group-hover:border-cyber-cyan/80 group-hover:bg-cyber-cyan/10 transition-all duration-300"
                                            style={{ height: `${Math.max(heightPercent, 2)}%` }}
                                        >
                                            {/* Accent glow on top of bar */}
                                            {d.calories > 0 && <div className="h-1 bg-cyber-blue w-full shadow-[0_0_8px_rgba(0,204,255,0.8)]"></div>}
                                        </div>

                                        {/* Label */}
                                        <span className="text-[8px] text-gray-500 mt-2 font-orbitron text-center truncate w-full">{d.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Macro Averages Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-850">
                        {(() => {
                            const totalC = groupedData.reduce((sum, d) => sum + d.calories, 0);
                            const totalP = groupedData.reduce((sum, d) => sum + d.protein, 0);
                            const totalCb = groupedData.reduce((sum, d) => sum + d.carbs, 0);
                            const totalF = groupedData.reduce((sum, d) => sum + d.fat, 0);
                            const daysWithLogs = groupedData.filter(d => d.calories > 0).length || 1;

                            return (
                                <>
                                    <div className="text-center p-3 bg-[#050508] border border-gray-850 rounded">
                                        <span className="text-[9px] text-gray-500 uppercase tracking-widest font-orbitron block">Avg Calories</span>
                                        <span className="font-orbitron text-md text-white font-bold">{Math.round(totalC / daysWithLogs)} <span className="text-[10px] text-gray-500">kcal</span></span>
                                    </div>
                                    <div className="text-center p-3 bg-[#050508] border border-gray-850 rounded">
                                        <span className="text-[9px] text-gray-500 uppercase tracking-widest font-orbitron block">Avg Protein</span>
                                        <span className="font-orbitron text-md text-cyber-cyan font-bold">{Math.round(totalP / daysWithLogs)}g</span>
                                    </div>
                                    <div className="text-center p-3 bg-[#050508] border border-gray-850 rounded">
                                        <span className="text-[9px] text-gray-500 uppercase tracking-widest font-orbitron block">Avg Carbs</span>
                                        <span className="font-orbitron text-md text-cyber-blue font-bold">{Math.round(totalCb / daysWithLogs)}g</span>
                                    </div>
                                    <div className="text-center p-3 bg-[#050508] border border-gray-850 rounded">
                                        <span className="text-[9px] text-gray-500 uppercase tracking-widest font-orbitron block">Avg Fats</span>
                                        <span className="font-orbitron text-md text-cyber-pink font-bold">{Math.round(totalF / daysWithLogs)}g</span>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
}
