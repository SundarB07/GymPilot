import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Trash2, Plus, RefreshCw, Loader2, Save, X, Edit2, RotateCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getRealisticPortion, recalibrateMealPortions } from '../utils/dietGenerator';

export default function MyDietPlan() {
    const { user, dietPlan, setDietPlan, dietPlanLoaded, setDietPlanLoaded } = useAuth();
    const [loading, setLoading] = useState(!dietPlanLoaded);
    const [saving, setSaving] = useState(false);
    const [plan, setPlan] = useState(dietPlan);
    const [hasChanges, setHasChanges] = useState(false);
    const [dbFoods, setDbFoods] = useState([]);
    const [replaceModalData, setReplaceModalData] = useState(null);

    // Editing states
    const [addingItemToMealIndex, setAddingItemToMealIndex] = useState(null);
    const [newItem, setNewItem] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', is_optional: false, alternative_name: '' });
    
    // Sync context changes when plan is edited
    useEffect(() => {
        setDietPlan(plan);
    }, [plan, setDietPlan]);

    useEffect(() => {
        if (user && !dietPlanLoaded) {
            fetchDietPlan();
        }
    }, [user, dietPlanLoaded]);

    useEffect(() => {
        if (user) {
            supabase.from('foods').select('*').then(({ data }) => {
                if (data) setDbFoods(data);
            });
        }
    }, [user]);

    async function fetchDietPlan() {
        try {
            setLoading(true);
            const { data: foodsData } = await supabase.from('foods').select('*');
            if (foodsData) {
                setDbFoods(foodsData);
            }

            const { data, error } = await supabase
                .from('dietplans')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (data) {
                setPlan(data);
                setDietPlan(data);
            }
            setDietPlanLoaded(true);
        } catch (err) {
            console.error('Error fetching diet plan:', err);
        } finally {
            setLoading(false);
        }
    }

    const getFoodGroup = (food) => {
        if (!food) return 'Other';
        const name = food.food_name.toLowerCase();
        const group = (food.food_group || '').toLowerCase();
        const cat = (food.category || '').toLowerCase();

        if (group.includes('protein') || name.includes('egg') || name.includes('chicken') || name.includes('fish') || name.includes('tuna') || name.includes('prawns') || name.includes('paneer') || name.includes('tofu') || name.includes('soy') || name.includes('milk') || name.includes('curd') || name.includes('rajma') || name.includes('chickpeas') || name.includes('sprouts') || name.includes('yogurt')) {
            return 'Protein';
        }
        if (group.includes('carb') || name.includes('rice') || name.includes('chapati') || name.includes('roti') || name.includes('oats') || name.includes('idli') || name.includes('dosa') || name.includes('appam') || name.includes('poha') || name.includes('sweet potato') || name.includes('potato')) {
            return 'Carb';
        }
        if (group.includes('fruit') || cat.includes('fruit') || name.includes('banana') || name.includes('apple') || name.includes('orange') || name.includes('guava') || name.includes('papaya') || name.includes('watermelon')) {
            return 'Fruit';
        }
        if (group.includes('fat') || group.includes('nut') || group.includes('seed') || name.includes('almond') || name.includes('walnut') || name.includes('peanut') || name.includes('cashew') || name.includes('flax') || name.includes('chia')) {
            return 'Healthy Fat';
        }
        return 'Other';
    };

    const findDbFood = (itemName) => {
        return dbFoods.find(f => {
            const cleanName = f.food_name.toLowerCase();
            const cleanItem = itemName.toLowerCase();
            return cleanItem.includes(cleanName) || cleanName.includes(cleanItem);
        }) || null;
    };

    const triggerReplaceItem = (mealIndex, itemIndex) => {
        const meal = plan.plan_data.meals[mealIndex];
        const item = meal.items[itemIndex];
        const currentFood = findDbFood(item.name);
        const currentGroup = getFoodGroup(currentFood);
        const alternatives = dbFoods.filter(f => {
            if (plan && plan.style === 'Veg' && f.type === 'Non-Veg') return false;
            return getFoodGroup(f) === currentGroup && f.food_name.toLowerCase() !== (currentFood ? currentFood.food_name.toLowerCase() : '');
        });

        setReplaceModalData({
            mealIndex,
            itemIndex,
            item,
            currentGroup,
            alternatives
        });
    };

    const handleReplaceItem = (replacementFood) => {
        if (!replaceModalData || !replacementFood) return;
        const { mealIndex, itemIndex, item } = replaceModalData;

        // Calculate equivalent scale
        let scale = 1.0;
        const group = getFoodGroup(replacementFood);

        if (group === 'Protein') {
            const proteinToMatch = item.protein;
            scale = replacementFood.protein_g > 0 ? proteinToMatch / replacementFood.protein_g : 1.0;
        } else if (group === 'Carb' || group === 'Fruit') {
            const carbsToMatch = item.carbs;
            scale = replacementFood.carbs_g > 0 ? carbsToMatch / replacementFood.carbs_g : 1.0;
        } else if (group === 'Healthy Fat') {
            const fatToMatch = item.fat;
            scale = replacementFood.fat_g > 0 ? fatToMatch / replacementFood.fat_g : 1.0;
        } else {
            const caloriesToMatch = item.calories;
            scale = replacementFood.calories_kcal > 0 ? caloriesToMatch / replacementFood.calories_kcal : 1.0;
        }

        // Generate the new scaled item
        const replacementItem = getRealisticPortion(replacementFood, scale);
        if (!replacementItem) return;

        // Update meals list
        const updatedMeals = JSON.parse(JSON.stringify(plan.plan_data.meals));
        updatedMeals[mealIndex].items[itemIndex] = replacementItem;

        // Perform recalibration solver on the new meals
        const targets = {
            targetCalories: plan.plan_data.targetCalories,
            protein: plan.plan_data.macros.protein,
            carbs: plan.plan_data.macros.carbs,
            fat: plan.plan_data.macros.fat,
            fiber: plan.plan_data.macros.fiber
        };

        const recalibrated = recalibrateMealPortions(updatedMeals, targets, dbFoods);
        
        if (recalibrated) {
            setPlan({
                ...plan,
                target_calories: Math.round(recalibrated.totalCals),
                plan_data: {
                    ...plan.plan_data,
                    targetCalories: plan.plan_data.targetCalories, // Preserve original targets
                    macros: plan.plan_data.macros, // Preserve original targets
                    meals: recalibrated.meals
                }
            });
        } else {
            const totals = calculateOverallPlanTotals(updatedMeals);
            setPlan({
                ...plan,
                target_calories: totals.targetCalories,
                plan_data: {
                    ...plan.plan_data,
                    meals: updatedMeals
                }
            });
        }

        setHasChanges(true);
        setReplaceModalData(null);
    };

    const calculateOverallPlanTotals = (updatedMeals) => {
        let totalCals = 0;
        let totalP = 0;
        let totalC = 0;
        let totalF = 0;

        updatedMeals.forEach(m => {
            const items = m.items || [];
            items.forEach(i => {
                totalCals += Number(i.calories || 0);
                totalP += Number(i.protein || 0);
                totalC += Number(i.carbs || 0);
                totalF += Number(i.fat || 0);
            });
        });

        return {
            targetCalories: totalCals,
            macros: {
                protein: totalP,
                carbs: totalC,
                fat: totalF,
                fiber: plan.plan_data.macros.fiber
            }
        };
    };

    const handleRemoveItem = (mealIndex, itemIndex) => {
        // Trigger replace flow instead of direct deletion
        triggerReplaceItem(mealIndex, itemIndex);
    };

    const handleAddItem = (mealIndex) => {
        if (!newItem.name) return;

        const itemToAdd = {
            name: newItem.name,
            calories: parseInt(newItem.calories) || 0,
            protein: parseInt(newItem.protein) || 0,
            carbs: parseInt(newItem.carbs) || 0,
            fat: parseInt(newItem.fat) || 0,
            is_optional: !!newItem.is_optional,
            alternative_name: newItem.alternative_name || null
        };

        const updatedMeals = JSON.parse(JSON.stringify(plan.plan_data.meals));
        if (!updatedMeals[mealIndex].items) {
            updatedMeals[mealIndex].items = [];
        }
        updatedMeals[mealIndex].items.push(itemToAdd);

        const targets = {
            targetCalories: plan.plan_data.targetCalories,
            protein: plan.plan_data.macros.protein,
            carbs: plan.plan_data.macros.carbs,
            fat: plan.plan_data.macros.fat,
            fiber: plan.plan_data.macros.fiber
        };

        const recalibrated = recalibrateMealPortions(updatedMeals, targets, dbFoods);
        
        if (recalibrated) {
            setPlan({
                ...plan,
                target_calories: Math.round(recalibrated.totalCals),
                plan_data: {
                    ...plan.plan_data,
                    meals: recalibrated.meals
                }
            });
        } else {
            const totals = calculateOverallPlanTotals(updatedMeals);
            setPlan({
                ...plan,
                target_calories: totals.targetCalories,
                plan_data: {
                    ...plan.plan_data,
                    meals: updatedMeals
                }
            });
        }

        // Reset adding form
        setNewItem({ name: '', calories: '', protein: '', carbs: '', fat: '' });
        setAddingItemToMealIndex(null);
        setHasChanges(true);
    };

    const handleSavePlan = async () => {
        try {
            setSaving(true);
            const { error: saveError } = await supabase
                .from('dietplans')
                .update({
                    target_calories: plan.target_calories,
                    plan_data: plan.plan_data,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', user.id);

            if (saveError) throw saveError;
            setHasChanges(false);
            alert('Diet Protocol saved successfully!');
        } catch (err) {
            console.error('Error saving diet plan:', err);
            alert('Failed to save changes.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse pb-12">
                {/* Title Bar Skeleton */}
                <div className="flex justify-between items-center border-b border-gray-800 pb-4">
                    <div className="flex items-center space-x-3">
                        <div className="bg-gray-800/40 h-8 w-8 rounded-full"></div>
                        <div className="bg-gray-800/40 h-6 w-48 rounded"></div>
                    </div>
                    <div className="bg-gray-800/40 h-8 w-24 rounded"></div>
                </div>

                {/* Quick Metrics Skeleton */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-800/20 border border-gray-800/50 h-20 rounded-xl"></div>
                    <div className="bg-gray-800/20 border border-gray-800/50 h-20 rounded-xl"></div>
                    <div className="bg-gray-800/20 border border-gray-800/50 h-20 rounded-xl"></div>
                </div>

                {/* Target Daily Macros Skeleton */}
                <div className="bg-gray-800/20 border border-gray-800/50 p-5 rounded-xl space-y-4">
                    <div className="bg-gray-800/40 h-4 w-36 rounded"></div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-[#050508] border border-gray-800 h-16 rounded-lg"></div>
                        <div className="bg-[#050508] border border-gray-800 h-16 rounded-lg"></div>
                        <div className="bg-[#050508] border border-gray-800 h-16 rounded-lg"></div>
                        <div className="bg-[#050508] border border-gray-800 h-16 rounded-lg"></div>
                    </div>
                </div>

                {/* Meal Sequences Skeleton */}
                <div className="space-y-4">
                    <div className="bg-gray-800/40 h-4 w-32 rounded"></div>
                    <div className="space-y-3">
                        <div className="bg-gray-800/10 border border-gray-800/40 h-24 rounded-xl"></div>
                        <div className="bg-gray-800/10 border border-gray-800/40 h-24 rounded-xl"></div>
                        <div className="bg-gray-800/10 border border-gray-800/40 h-24 rounded-xl"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="space-y-6 text-center py-12">
                <div className="max-w-md mx-auto cyber-card p-8 space-y-6">
                    <Sparkles className="text-gray-650 w-16 h-16 mx-auto drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
                    <h2 className="text-xl font-bold font-orbitron text-white">No Diet Protocol Active</h2>
                    <p className="text-gray-400 text-sm">
                        You have not generated a nutrition plan yet. Initialize your personalized calorie and macro targets to start tracking.
                    </p>
                    <Link to="/generate-diet" className="cyber-button inline-flex items-center text-sm px-6 py-3">
                        <Plus size={16} className="mr-2" />
                        INITIALIZE DIET PLAN
                    </Link>
                </div>
            </div>
        );
    }

    const { target_calories, category, style, plan_data } = plan;
    const { macros = {}, meals = [], bmi, waterRequirement } = plan_data;

    const categoryLabels = {
        loss: 'Weight Loss',
        maintenance: 'Maintenance',
        lean: 'Lean Muscle Gain',
        fast: 'Fast Weight Gain'
    };

    const styleLabels = {
        Veg: 'Veg',
        'Non-Veg': 'Non-Veg'
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* Title Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-800 pb-4">
                <div className="flex items-center space-x-3">
                    <Sparkles className="text-cyber-cyan w-8 h-8 drop-shadow-[0_0_10px_rgba(0,245,255,0.8)]" />
                    <h1 className="text-2xl font-bold font-orbitron neon-text">Diet Plan Protocol</h1>
                </div>
                <div className="flex gap-2">
                    {hasChanges && (
                        <button 
                            onClick={handleSavePlan}
                            disabled={saving}
                            className="bg-green-650 border border-green-500 text-white font-orbitron text-xs px-4 py-2 rounded flex items-center shadow-[0_0_10px_rgba(34,197,94,0.3)] hover:bg-green-600 transition-all cursor-pointer"
                        >
                            {saving ? <Loader2 size={12} className="animate-spin mr-1.5" /> : <Save size={12} className="mr-1.5" />}
                            Save Protocol
                        </button>
                    )}
                    <Link to="/generate-diet" className="border border-cyber-blue/40 hover:bg-cyber-blue/10 text-cyber-cyan font-orbitron text-xs px-3 py-2 rounded flex items-center transition-colors">
                        <RefreshCw size={12} className="mr-1.5" />
                        Re-generate
                    </Link>
                </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div className="cyber-card p-3 text-center">
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest font-orbitron block mb-1">Calories</span>
                    <span className="font-orbitron text-md md:text-lg text-cyber-cyan">{target_calories}<span className="text-[10px] text-gray-500 ml-0.5">kcal</span></span>
                </div>
                <div className="cyber-card p-3 text-center">
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest font-orbitron block mb-1">Protein</span>
                    <span className="font-orbitron text-md md:text-lg text-white">{macros.protein}g</span>
                </div>
                <div className="cyber-card p-3 text-center">
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest font-orbitron block mb-1">Carbs</span>
                    <span className="font-orbitron text-md md:text-lg text-cyber-blue">{macros.carbs}g</span>
                </div>
                <div className="cyber-card p-3 text-center">
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest font-orbitron block mb-1">Fat</span>
                    <span className="font-orbitron text-md md:text-lg text-cyber-pink">{macros.fat}g</span>
                </div>
                <div className="cyber-card p-3 text-center">
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest font-orbitron block mb-1">Water</span>
                    <span className="font-orbitron text-md md:text-lg text-cyber-blue">{waterRequirement || plan_data.waterRequirement || '3.5'}L</span>
                </div>
                <div className="cyber-card p-3 text-center">
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest font-orbitron block mb-1">BMI</span>
                    <span className="font-orbitron text-md md:text-lg text-purple-400">{bmi || plan.bmi || '22.0'}</span>
                </div>
            </div>

            {/* Macro Targets */}
            <div className="cyber-card space-y-4">
                <h3 className="font-orbitron text-sm text-white tracking-widest uppercase">Target Daily Macros</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Protein */}
                    <div className="bg-[#050508] border border-gray-800 p-3 rounded-lg">
                        <span className="text-[9px] text-gray-500 uppercase tracking-wider block mb-1">Protein</span>
                        <span className="font-orbitron text-xl text-cyber-cyan">{macros.protein || 0}g</span>
                        <div className="w-full bg-gray-900 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className="bg-cyber-cyan h-full shadow-[0_0_8px_#00f5ff]" style={{ width: '100%' }}></div>
                        </div>
                    </div>

                    {/* Carbs */}
                    <div className="bg-[#050508] border border-gray-800 p-3 rounded-lg">
                        <span className="text-[9px] text-gray-500 uppercase tracking-wider block mb-1">Carbohydrates</span>
                        <span className="font-orbitron text-xl text-cyber-blue">{macros.carbs || 0}g</span>
                        <div className="w-full bg-gray-900 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className="bg-cyber-blue h-full shadow-[0_0_8px_#00ccff]" style={{ width: '100%' }}></div>
                        </div>
                    </div>

                    {/* Fat */}
                    <div className="bg-[#050508] border border-gray-800 p-3 rounded-lg">
                        <span className="text-[9px] text-gray-500 uppercase tracking-wider block mb-1">Fats</span>
                        <span className="font-orbitron text-xl text-cyber-pink">{macros.fat || 0}g</span>
                        <div className="w-full bg-gray-900 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className="bg-cyber-pink h-full shadow-[0_0_8px_#fe53bb]" style={{ width: '100%' }}></div>
                        </div>
                    </div>

                    {/* Fiber */}
                    <div className="bg-[#050508] border border-gray-800 p-3 rounded-lg">
                        <span className="text-[9px] text-gray-500 uppercase tracking-wider block mb-1">Fiber</span>
                        <span className="font-orbitron text-xl text-purple-400">{macros.fiber || 0}g</span>
                        <div className="w-full bg-gray-900 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className="bg-purple-500 h-full shadow-[0_0_8px_#a855f7]" style={{ width: '100%' }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Meal Sequence Breakdown */}
            <div className="space-y-4">
                <h3 className="font-orbitron text-sm text-gray-400 tracking-widest uppercase">Meal Sequences</h3>
                
                <div className="space-y-4">
                    {meals.map((meal, mealIndex) => {
                        const items = meal.items || [];
                        // Calculate specific meal total macros
                        const mealCals = items.reduce((sum, i) => sum + Number(i.calories || 0), 0);
                        const mealP = items.reduce((sum, i) => sum + Number(i.protein || 0), 0);
                        const mealC = items.reduce((sum, i) => sum + Number(i.carbs || 0), 0);
                        const mealF = items.reduce((sum, i) => sum + Number(i.fat || 0), 0);

                        return (
                            <div key={mealIndex} className="cyber-card p-5 border border-cyber-blue/15 hover:border-cyber-cyan/30 transition-all duration-300">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-gray-800 pb-2 mb-3">
                                    <h4 className="font-orbitron text-white text-md font-bold">{meal.name}</h4>
                                    <span className="text-xs text-cyber-cyan font-semibold font-orbitron bg-cyber-blue/5 border border-cyber-cyan/20 px-2.5 py-0.5 rounded mt-1 sm:mt-0 max-w-max">
                                        {mealCals > 0 ? `${mealCals} kcal | P: ${mealP}g | C: ${mealC}g | F: ${mealF}g` : meal.target || 'No target'}
                                    </span>
                                </div>

                                {meal.note && (
                                    <p className="text-xs text-gray-400 italic mb-3 pl-1">{meal.note}</p>
                                )}
                                
                                {/* Foods Bullet Point List */}
                                <ul className="space-y-2 mb-4">
                                    {items.map((item, itemIndex) => (
                                        <li key={itemIndex} className="flex justify-between items-center text-sm text-gray-300 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-cyber-cyan">
                                            <span>
                                                <strong className="text-white">{item.name}</strong> 
                                                {item.is_optional && (
                                                    <span className="text-xs text-purple-400 font-semibold ml-2 uppercase tracking-wide">
                                                        (Optional{item.alternative_name ? ` — alternative: ${item.alternative_name}` : ''})
                                                    </span>
                                                )}
                                                {item.type === 'Supplement' || (item.name.toLowerCase().includes('creatine') && item.calories === 0) ? (
                                                     <span className="text-xs text-cyber-cyan/80 font-orbitron ml-2">— Supplement</span>
                                                 ) : (
                                                     <span className="text-xs text-gray-500 ml-2">
                                                         ({item.calories} kcal | P: {item.protein}g | C: {item.carbs}g | F: {item.fat}g)
                                                     </span>
                                                 )}
                                            </span>
                                            <button 
                                                onClick={() => triggerReplaceItem(mealIndex, itemIndex)}
                                                className="text-gray-500 hover:text-cyber-cyan p-1 transition-colors flex items-center gap-1 text-[11px] font-orbitron uppercase cursor-pointer"
                                                title="Replace item with alternative"
                                            >
                                                <RotateCw size={12} className="text-cyber-cyan" />
                                                <span className="hidden sm:inline">Replace</span>
                                            </button>
                                        </li>
                                    ))}
                                    {items.length === 0 && meal.suggestions && (
                                        <li className="text-xs text-gray-405 italic pl-4">{meal.suggestions}</li>
                                    )}
                                    {items.length === 0 && !meal.suggestions && (
                                        <li className="text-xs text-gray-500 italic pl-4">No food items listed for this meal.</li>
                                    )}
                                </ul>

                                {/* Add Custom Item form/button */}
                                {addingItemToMealIndex === mealIndex ? (
                                    <div className="bg-[#050508] border border-cyber-cyan/20 p-3 rounded space-y-3 mt-3">
                                        <span className="text-[10px] text-cyber-cyan uppercase font-orbitron tracking-wider block">Add Custom Food Item</span>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <input 
                                                type="text" 
                                                placeholder="Food Item Name (e.g. Eggs)" 
                                                value={newItem.name} 
                                                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                                className="cyber-input text-xs"
                                            />
                                            <input 
                                                type="number" 
                                                placeholder="Calories (kcal)" 
                                                value={newItem.calories} 
                                                onChange={(e) => setNewItem({ ...newItem, calories: e.target.value })}
                                                className="cyber-input text-xs"
                                            />
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <input 
                                                type="number" 
                                                placeholder="Protein (g)" 
                                                value={newItem.protein} 
                                                onChange={(e) => setNewItem({ ...newItem, protein: e.target.value })}
                                                className="cyber-input text-xs"
                                            />
                                            <input 
                                                type="number" 
                                                placeholder="Carbs (g)" 
                                                value={newItem.carbs} 
                                                onChange={(e) => setNewItem({ ...newItem, carbs: e.target.value })}
                                                className="cyber-input text-xs"
                                            />
                                            <input 
                                                type="number" 
                                                placeholder="Fat (g)" 
                                                value={newItem.fat} 
                                                onChange={(e) => setNewItem({ ...newItem, fat: e.target.value })}
                                                className="cyber-input text-xs"
                                            />
                                        </div>
                                        {/* Optional & Alternative name */}
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                            <label className="flex items-center space-x-2 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={newItem.is_optional}
                                                    onChange={(e) => setNewItem({ ...newItem, is_optional: e.target.checked })}
                                                    className="w-4 h-4 accent-cyber-blue"
                                                />
                                                <span className="text-xs text-gray-300">Mark as Optional</span>
                                            </label>
                                            {newItem.is_optional && (
                                                <input 
                                                    type="text" 
                                                    placeholder="Alternative food (e.g. 1 Cup Curd)" 
                                                    value={newItem.alternative_name} 
                                                    onChange={(e) => setNewItem({ ...newItem, alternative_name: e.target.value })}
                                                    className="cyber-input text-xs py-1 px-2 flex-1"
                                                />
                                            )}
                                        </div>
                                        <div className="flex justify-end gap-2 pt-1">
                                            <button 
                                                onClick={() => setAddingItemToMealIndex(null)}
                                                className="border border-gray-700 hover:bg-gray-800 text-gray-300 text-[10px] font-orbitron px-3 py-1 rounded cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={() => handleAddItem(mealIndex)}
                                                className="bg-cyber-blue/15 border border-cyber-cyan/40 hover:bg-cyber-cyan/15 text-cyber-cyan text-[10px] font-orbitron px-3 py-1 rounded cursor-pointer"
                                            >
                                                Add Item
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => {
                                            setNewItem({ name: '', calories: '', protein: '', carbs: '', fat: '', is_optional: false, alternative_name: '' });
                                            setAddingItemToMealIndex(mealIndex);
                                        }}
                                        className="text-xs text-cyber-cyan hover:text-cyber-blue font-orbitron flex items-center gap-1 mt-2 transition-colors cursor-pointer"
                                    >
                                        <Plus size={12} />
                                        Add Custom Food
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Replace Item Modal */}
            {replaceModalData && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="cyber-card max-w-md w-full p-6 space-y-4 border border-cyber-cyan/30 animate-fade-in relative">
                        <button 
                            onClick={() => setReplaceModalData(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <X size={18} />
                        </button>

                        <h3 className="text-lg font-bold font-orbitron text-white flex items-center gap-2">
                            <RotateCw className="text-cyber-cyan animate-spin-slow" size={18} />
                            REPLACE FOOD ITEM
                        </h3>

                        <div className="bg-[#050508] border border-gray-800 p-3 rounded-lg space-y-1">
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Food to Replace</span>
                            <span className="text-sm font-semibold text-white">{replaceModalData.item.name}</span>
                            <span className="text-xs text-cyber-cyan font-orbitron block">
                                Group: {replaceModalData.currentGroup} ({replaceModalData.item.calories} kcal | P: {replaceModalData.item.protein}g | C: {replaceModalData.item.carbs}g | F: {replaceModalData.item.fat}g)
                            </span>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-gray-400 uppercase tracking-wide font-orbitron">Choose a suitable alternative from the same food group:</label>
                            <div className="max-h-60 overflow-y-auto border border-gray-800 rounded bg-[#050508] divide-y divide-gray-900">
                                {replaceModalData.alternatives.map((food, idx) => {
                                    let scale = 1.0;
                                    const group = replaceModalData.currentGroup;
                                    if (group === 'Protein') {
                                        scale = food.protein_g > 0 ? replaceModalData.item.protein / food.protein_g : 1.0;
                                    } else if (group === 'Carb' || group === 'Fruit') {
                                        scale = food.carbs_g > 0 ? replaceModalData.item.carbs / food.carbs_g : 1.0;
                                    } else if (group === 'Healthy Fat') {
                                        scale = food.fat_g > 0 ? replaceModalData.item.fat / food.fat_g : 1.0;
                                    } else {
                                        scale = food.calories_kcal > 0 ? replaceModalData.item.calories / food.calories_kcal : 1.0;
                                    }
                                    const estimatedItem = getRealisticPortion(food, scale);

                                    return (
                                        <button 
                                            key={idx}
                                            onClick={() => handleReplaceItem(food)}
                                            className="w-full text-left p-3 hover:bg-cyber-blue/10 transition-colors flex justify-between items-center group cursor-pointer"
                                        >
                                            <div className="space-y-0.5">
                                                <span className="text-sm font-medium text-gray-200 group-hover:text-cyber-cyan transition-colors">{estimatedItem ? estimatedItem.name : food.food_name}</span>
                                                <span className="text-[10px] text-gray-500 block">
                                                    Base: {food.calories_kcal} kcal per {food.category === 'Drink' ? '100ml' : '100g'}
                                                </span>
                                            </div>
                                            <div className="text-right text-[11px] font-orbitron text-gray-400">
                                                {estimatedItem ? `${estimatedItem.calories} kcal | P: ${estimatedItem.protein}g | C: ${estimatedItem.carbs}g` : ''}
                                            </div>
                                        </button>
                                    );
                                })}
                                {replaceModalData.alternatives.length === 0 && (
                                    <div className="p-4 text-center text-xs text-gray-500 italic">No alternative foods found in this group.</div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                            <button 
                                onClick={() => setReplaceModalData(null)}
                                className="border border-gray-700 hover:bg-gray-800 text-gray-300 font-orbitron text-xs px-4 py-2 rounded cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
