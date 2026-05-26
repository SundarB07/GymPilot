import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Apple, Plus, Loader2, Info } from 'lucide-react';

export default function DietLog() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState('');
    const [logs, setLogs] = useState([]);

    const [mealType, setMealType] = useState('Breakfast');
    const [foodItems, setFoodItems] = useState('');
    const [protein, setProtein] = useState('');
    const [wheyTaken, setWheyTaken] = useState(false);
    const [wheyGrams, setWheyGrams] = useState('');
    const [creatineTaken, setCreatineTaken] = useState(false);
    const [creatineGrams, setCreatineGrams] = useState('');

    useEffect(() => {
        fetchLogs();
    }, [user]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { error: insertError } = await supabase
                .from('dietlogs')
                .insert([{
                    user_id: user.id,
                    date: new Date().toISOString().split('T')[0],
                    meal_type: mealType,
                    food_items: foodItems,
                    protein: parseFloat(protein) || 0,
                    whey_taken: wheyTaken,
                    whey_grams: wheyTaken ? (parseFloat(wheyGrams) || 0) : 0,
                    creatine_taken: creatineTaken,
                    creatine_grams: creatineTaken ? (parseFloat(creatineGrams) || 0) : 0,
                }]);

            if (insertError) throw insertError;

            setFoodItems('');
            setProtein('');
            setWheyTaken(false);
            setWheyGrams('');
            setCreatineTaken(false);
            setCreatineGrams('');

            fetchLogs();
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to log meal.');
        } finally {
            setLoading(false);
        }
    };

    const totalProtein = logs.reduce((sum, log) => sum + Number(log.protein) + (log.whey_taken ? (Number(log.whey_grams) * 0.8) : 0), 0);
    const totalCreatine = logs.reduce((sum, log) => sum + (log.creatine_taken ? Number(log.creatine_grams) : 0), 0);

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="flex items-center space-x-3 mb-6">
                <Apple className="text-purple-400 w-8 h-8 drop-shadow-[0_0_10px_rgba(183,108,253,0.8)]" />
                <h1 className="text-2xl font-bold font-orbitron neon-text">Nutritional Telemetry</h1>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="cyber-card flex flex-col items-center justify-center p-4">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Total Protein</span>
                    <span className="font-orbitron text-2xl text-cyber-cyan">{Math.round(totalProtein)}<span className="text-sm text-gray-500 ml-1">g</span></span>
                </div>
                <div className="cyber-card flex flex-col items-center justify-center p-4">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Creatine Load</span>
                    <span className="font-orbitron text-2xl text-cyber-blue">{totalCreatine}<span className="text-sm text-gray-500 ml-1">g</span></span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="cyber-card space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-cyber-pink/20 blur-2xl rounded-full"></div>
                <h2 className="font-orbitron text-lg text-white mb-2 relative z-10">Log Fuel Intake</h2>

                {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-2 rounded text-xs">{error}</div>}

                <div className="grid grid-cols-2 gap-3 relative z-10">
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
                            <option value="Pre-workout">Pre-workout</option>
                            <option value="Post-workout">Post-workout</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-400 uppercase tracking-wide ml-1">Protein (g)</label>
                        <input
                            type="number"
                            required
                            value={protein}
                            onChange={(e) => setProtein(e.target.value)}
                            placeholder="e.g. 30"
                            className="w-full bg-[#050508] border border-gray-700/50 focus:border-purple-400 rounded p-2 text-white text-sm mt-1"
                        />
                    </div>
                </div>

                <div className="relative z-10">
                    <label className="text-[10px] text-gray-400 uppercase tracking-wide ml-1">Food Items</label>
                    <input
                        type="text"
                        required
                        value={foodItems}
                        onChange={(e) => setFoodItems(e.target.value)}
                        placeholder="e.g. 3 Eggs, Toast, Coffee"
                        className="w-full bg-[#050508] border border-gray-700/50 focus:border-purple-400 rounded p-2 text-white text-sm mt-1"
                    />
                </div>

                <div className="p-3 rounded border border-gray-800 bg-[#0a0a0f] space-y-3 relative z-10">
                    <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={wheyTaken}
                                onChange={() => setWheyTaken(!wheyTaken)}
                                className="w-4 h-4 accent-cyber-blue"
                            />
                            <span className="text-sm text-gray-300">Whey Protein Added</span>
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
                            <span className="text-sm text-gray-300">Creatine Load</span>
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

                <button disabled={loading} type="submit" className="w-full bg-purple-500 hover:bg-purple-400 text-white font-orbitron py-3 rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_20px_rgba(168,85,247,0.6)] transition-all flex justify-center items-center text-sm tracking-widest relative z-10">
                    {loading ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : <Plus className="mr-2 w-4 h-4" />}
                    LOG INTAKE
                </button>
            </form>

            <div className="mt-8">
                <h3 className="font-orbitron text-sm text-gray-400 mb-4 tracking-widest uppercase">Today's Logs</h3>

                {fetching ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin text-purple-400" /></div>
                ) : logs.length === 0 ? (
                    <div className="text-center p-6 border border-dashed border-gray-800 rounded-xl">
                        <Info className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 tracking-wide">No telemetry recorded today.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {logs.map((log) => (
                            <div key={log.id} className="cyber-card p-4 border border-purple-900/30 shadow-none hover:border-purple-500/30">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold text-cyber-cyan bg-cyber-blue/5 border border-cyber-cyan/20 px-2 py-0.5 rounded">{log.meal_type}</span>
                                    <span className="text-xs text-gray-500 font-orbitron">
                                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-gray-200 text-sm mb-3">{log.food_items}</p>

                                <div className="flex space-x-4 border-t border-gray-800 pt-3">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-gray-500 uppercase tracking-widest leading-none mb-1">Food Protein</span>
                                        <span className="text-sm text-white font-orbitron">{log.protein}g</span>
                                    </div>

                                    {log.whey_taken && (
                                        <div className="flex flex-col">
                                            <span className="text-[9px] text-gray-500 uppercase tracking-widest leading-none mb-1">Whey</span>
                                            <span className="text-sm text-cyber-cyan font-orbitron">{log.whey_grams}g</span>
                                        </div>
                                    )}

                                    {log.creatine_taken && (
                                        <div className="flex flex-col">
                                            <span className="text-[9px] text-gray-500 uppercase tracking-widest leading-none mb-1">Creatine</span>
                                            <span className="text-sm text-cyber-blue font-orbitron">{log.creatine_grams}g</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
