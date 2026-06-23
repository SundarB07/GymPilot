import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Scale, Calendar, Plus, Trash2, Loader2, ArrowRight } from 'lucide-react';

export default function WeightTracker() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [logs, setLogs] = useState([]);
    const [error, setError] = useState('');

    // Form State
    const [weightInput, setWeightInput] = useState('');
    const [dateInput, setDateInput] = useState(new Date().toISOString().split('T')[0]);

    // Goal Weight State (persisted in localStorage per user)
    const [goalWeight, setGoalWeight] = useState(() => {
        const saved = localStorage.getItem(`gympilot_goal_weight_${user?.id}`);
        return saved ? parseFloat(saved) : 75;
    });

    useEffect(() => {
        if (user) {
            fetchWeightLogs();
        }
    }, [user]);

    async function fetchWeightLogs() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('weight_logs')
                .select('*')
                .eq('user_id', user.id)
                .order('log_date', { ascending: true });

            if (error) throw error;
            setLogs(data || []);

            // Prefill weight input with latest logged weight
            if (data && data.length > 0) {
                const latestLog = data[data.length - 1];
                setWeightInput(latestLog.weight.toString());
            }
        } catch (err) {
            console.error('Error fetching weight logs:', err);
            setError('Failed to fetch weight logs.');
        } finally {
            setLoading(false);
        }
    }

    const handleLogWeight = async (e) => {
        e.preventDefault();
        if (!weightInput || parseFloat(weightInput) <= 0) {
            setError('Please enter a valid weight.');
            return;
        }

        const todayStr = new Date().toISOString().split('T')[0];
        if (dateInput > todayStr) {
            setError('Cannot log weight for a future date. Please select today or a past date.');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const weightVal = parseFloat(weightInput);

            // Upsert: unique constraint on (user_id, log_date)
            const { error: upsertError } = await supabase
                .from('weight_logs')
                .upsert({
                    user_id: user.id,
                    weight: weightVal,
                    log_date: dateInput
                }, { onConflict: 'user_id,log_date' });

            if (upsertError) throw upsertError;

            // Refresh logs
            await fetchWeightLogs();
        } catch (err) {
            console.error('Error logging weight:', err);
            setError(err.message || 'Failed to log weight.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteLog = async (id) => {
        if (!confirm('Are you sure you want to delete this weight log?')) return;
        setError('');
        try {
            const { error: deleteError } = await supabase
                .from('weight_logs')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;
            setLogs(prev => prev.filter(log => log.id !== id));
        } catch (err) {
            console.error('Error deleting log:', err);
            setError('Failed to delete weight log.');
        }
    };

    const handleGoalWeightChange = (val) => {
        const num = parseFloat(val) || 0;
        setGoalWeight(num);
        if (user) {
            localStorage.setItem(`gympilot_goal_weight_${user.id}`, num.toString());
        }
    };

    // Calculations
    const startingWeight = logs.length > 0 ? parseFloat(logs[0].weight) : 0;
    const currentWeight = logs.length > 0 ? parseFloat(logs[logs.length - 1].weight) : 0;
    const weightChange = logs.length > 0 ? currentWeight - startingWeight : 0;

    // Progress calculation
    let progressPercentage = 0;
    if (startingWeight > 0 && goalWeight !== startingWeight) {
        progressPercentage = ((currentWeight - startingWeight) / (goalWeight - startingWeight)) * 100;
        if (progressPercentage < 0) progressPercentage = 0;
        if (progressPercentage > 100) progressPercentage = 100;
    }
    progressPercentage = Math.round(progressPercentage);

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-cyber-blue/20 pb-4">
                <div className="flex items-center space-x-3">
                    <Scale className="text-cyber-cyan w-8 h-8 drop-shadow-[0_0_10px_rgba(0,245,255,0.8)] animate-pulse" />
                    <div>
                        <h1 className="text-2xl font-bold font-orbitron neon-text">Weight Telemetry</h1>
                        <p className="text-sm text-cyber-blue font-semibold uppercase tracking-widest">Biometric Tracking</p>
                    </div>
                </div>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm">{error}</div>}

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="animate-spin text-cyber-cyan w-10 h-10" />
                </div>
            ) : (
                <>
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="cyber-card p-4 border-cyber-blue/20">
                            <span className="text-[10px] text-gray-500 font-orbitron uppercase tracking-widest block">Starting Weight</span>
                            <span className="text-2xl font-extrabold font-orbitron text-white">
                                {startingWeight > 0 ? `${startingWeight} kg` : '--'}
                            </span>
                        </div>
                        <div className="cyber-card p-4 border-cyber-pink/20">
                            <span className="text-[10px] text-gray-500 font-orbitron uppercase tracking-widest block">Current Weight</span>
                            <span className="text-2xl font-extrabold font-orbitron text-cyber-pink drop-shadow-[0_0_10px_rgba(254,83,187,0.4)]">
                                {currentWeight > 0 ? `${currentWeight} kg` : '--'}
                            </span>
                        </div>
                        <div className="cyber-card p-4 border-cyber-cyan/20">
                            <span className="text-[10px] text-gray-500 font-orbitron uppercase tracking-widest block">Goal Weight</span>
                            <div className="flex items-center space-x-1.5 mt-0.5">
                                <input
                                    type="number"
                                    step="0.1"
                                    value={goalWeight || ''}
                                    onChange={(e) => handleGoalWeightChange(e.target.value)}
                                    className="w-20 bg-transparent border-b border-cyber-cyan/30 text-2xl font-extrabold font-orbitron text-cyber-cyan focus:outline-none focus:border-cyber-cyan"
                                />
                                <span className="text-xs text-gray-400 font-orbitron">kg</span>
                            </div>
                        </div>
                        <div className="cyber-card p-4 border-emerald-500/20">
                            <span className="text-[10px] text-gray-500 font-orbitron uppercase tracking-widest block">Weight Change</span>
                            <span className={`text-2xl font-extrabold font-orbitron ${weightChange > 0 ? 'text-rose-500' : weightChange < 0 ? 'text-emerald-400' : 'text-gray-300'}`}>
                                {logs.length > 0 ? (weightChange >= 0 ? `+${weightChange.toFixed(1)}` : `${weightChange.toFixed(1)}`) : '--'} kg
                            </span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {logs.length > 0 && (
                        <div className="cyber-card p-4 border-cyber-blue/10 bg-[#07070c]">
                            <div className="flex justify-between items-center mb-1 text-xs">
                                <span className="font-orbitron uppercase tracking-wider text-gray-400">Target Progress</span>
                                <span className="font-orbitron font-bold text-cyber-cyan">{progressPercentage}%</span>
                            </div>
                            <div className="w-full bg-[#050508] h-2.5 rounded-full overflow-hidden border border-cyber-blue/10">
                                <div
                                    className="bg-gradient-to-r from-cyber-blue to-cyber-cyan h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(0,245,255,0.5)]"
                                    style={{ width: `${progressPercentage}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    {/* Main Layout Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Graph Section */}
                        <div className="lg:col-span-2 cyber-card p-4 border-cyber-blue/20 bg-[#0f0f15]">
                            <h3 className="font-orbitron text-cyber-cyan mb-4 flex items-center space-x-2">
                                <span>Weight Progress History</span>
                            </h3>

                            {logs.length === 0 ? (
                                <div className="h-64 flex flex-col items-center justify-center text-center space-y-2">
                                    <Scale className="w-12 h-12 text-gray-600 animate-pulse" />
                                    <p className="text-sm text-gray-500">No weight history yet.</p>
                                    <p className="text-xs text-gray-600">Log your body weight below to start tracking progress.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Line Chart */}
                                    <div className="h-64 flex flex-col justify-end border-b border-gray-800 pb-2 pt-4 relative">
                                        {(() => {
                                            const svgWidth = 800;
                                            const svgHeight = 220;

                                            // Extract weights and calculate dynamic range
                                            const weights = logs.map(d => parseFloat(d.weight));
                                            const minW = Math.min(...weights, goalWeight) - 2;
                                            const maxW = Math.max(...weights, goalWeight) + 2;
                                            const wRange = maxW - minW || 1;

                                            // Map points
                                            const points = logs.map((d, index) => {
                                                const x = (index / Math.max(logs.length - 1, 1)) * (svgWidth - 60) + 30;
                                                const y = svgHeight - 30 - ((parseFloat(d.weight) - minW) / wRange) * (svgHeight - 60);
                                                return { x, y, weight: d.weight, date: d.log_date };
                                            });

                                            // Draw Goal line
                                            const goalY = svgHeight - 30 - ((goalWeight - minW) / wRange) * (svgHeight - 60);

                                            // Path generator
                                            const pathD = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                                            const areaD = points.length > 0
                                                ? `${pathD} L ${points[points.length - 1].x} ${svgHeight - 30} L ${points[0].x} ${svgHeight - 30} Z`
                                                : '';

                                            return (
                                                <div className="w-full h-full relative">
                                                    {/* Y-Axis Guidelines */}
                                                    <div className="absolute right-0 top-0 h-full flex flex-col justify-between text-[8px] text-gray-600 font-orbitron select-none pointer-events-none pb-[30px] pt-[30px]">
                                                        <span>{maxW.toFixed(1)} kg</span>
                                                        <span>{((maxW + minW) / 2).toFixed(1)} kg</span>
                                                        <span>{minW.toFixed(1)} kg</span>
                                                    </div>

                                                    <svg
                                                        className="w-full h-full"
                                                        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                                                        preserveAspectRatio="none"
                                                    >
                                                        <defs>
                                                            <linearGradient id="weight-area-gradient" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="0%" stopColor="#00f5ff" stopOpacity="0.15" />
                                                                <stop offset="100%" stopColor="#00f5ff" stopOpacity="0.0" />
                                                            </linearGradient>
                                                        </defs>

                                                        {/* Horizontal grid lines */}
                                                        <line x1="30" y1={30} x2={svgWidth - 30} y2={30} stroke="#1f2937" strokeWidth="0.5" strokeDasharray="2,2" />
                                                        <line x1="30" y1={(svgHeight - 30 + 30) / 2} x2={svgWidth - 30} y2={(svgHeight - 30 + 30) / 2} stroke="#1f2937" strokeWidth="0.5" strokeDasharray="2,2" />
                                                        <line x1="30" y1={svgHeight - 30} x2={svgWidth - 30} y2={svgHeight - 30} stroke="#1f2937" strokeWidth="0.5" />

                                                        {/* Goal Weight Line */}
                                                        {goalWeight > 0 && goalY >= 30 && goalY <= svgHeight - 30 && (
                                                            <g>
                                                                <line
                                                                    x1="30"
                                                                    y1={goalY}
                                                                    x2={svgWidth - 30}
                                                                    y2={goalY}
                                                                    stroke="#ef4444"
                                                                    strokeWidth="1.5"
                                                                    strokeDasharray="4,4"
                                                                />
                                                                <text
                                                                    x={svgWidth - 110}
                                                                    y={goalY - 6}
                                                                    fill="#ef4444"
                                                                    className="text-[9px] font-orbitron font-semibold uppercase tracking-wider"
                                                                >
                                                                    Goal: {goalWeight} kg
                                                                </text>
                                                            </g>
                                                        )}

                                                        {/* Area Fill */}
                                                        {areaD && points.length > 1 && <path d={areaD} fill="url(#weight-area-gradient)" />}

                                                        {/* Line Path */}
                                                        {pathD && points.length > 1 && (
                                                            <path
                                                                d={pathD}
                                                                fill="none"
                                                                stroke="#00f5ff"
                                                                strokeWidth="2.5"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                style={{ filter: 'drop-shadow(0px 0px 4px rgba(0, 245, 255, 0.6))' }}
                                                            />
                                                        )}

                                                        {/* Interactive Points / Dots */}
                                                        {points.map((p, idx) => (
                                                            <g key={idx} className="group cursor-pointer">
                                                                <circle
                                                                    cx={p.x}
                                                                    cy={p.y}
                                                                    r="5"
                                                                    fill="#00f5ff"
                                                                    className="transition-all duration-300 group-hover:r-7 group-hover:fill-white"
                                                                />
                                                                <circle
                                                                    cx={p.x}
                                                                    cy={p.y}
                                                                    r="9"
                                                                    fill="none"
                                                                    stroke="#00f5ff"
                                                                    strokeWidth="1.5"
                                                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                                                />
                                                                {/* Hover tooltip for dot */}
                                                                <title>{`${p.weight} kg on ${new Date(p.date).toLocaleDateString()}`}</title>
                                                            </g>
                                                        ))}
                                                    </svg>

                                                    {/* X-Axis Labels (Date) */}
                                                    <div className="absolute left-0 bottom-0 w-full flex justify-between px-[30px] text-[8px] text-gray-500 font-orbitron select-none">
                                                        {points.length > 0 && (() => {
                                                            // Display start, middle, and end dates
                                                            const indices = [0];
                                                            if (points.length > 2) {
                                                                indices.push(Math.floor(points.length / 2));
                                                            }
                                                            if (points.length > 1) {
                                                                indices.push(points.length - 1);
                                                            }

                                                            return points.map((p, idx) => {
                                                                if (indices.includes(idx)) {
                                                                    const dateObj = new Date(p.date);
                                                                    const label = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                                                                    return <span key={idx} style={{ position: 'absolute', left: `${(p.x / svgWidth) * 100}%`, transform: 'translateX(-50%)' }}>{label}</span>;
                                                                }
                                                                return null;
                                                            });
                                                        })()}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Logging Card & History List */}
                        <div className="space-y-6">
                            {/* Logging Card */}
                            <div className="cyber-card p-4 border-cyber-pink/20 bg-[#0f0f15]">
                                <h3 className="font-orbitron text-cyber-pink mb-4 flex items-center space-x-2">
                                    <Plus className="w-5 h-5" />
                                    <span>Log Biometrics</span>
                                </h3>

                                <form onSubmit={handleLogWeight} className="space-y-4">
                                    <div>
                                        <label className="text-[10px] text-gray-500 uppercase tracking-widest pl-1 mb-1 block">Log Date</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                max={new Date().toISOString().split('T')[0]}
                                                value={dateInput}
                                                onChange={(e) => setDateInput(e.target.value)}
                                                className="w-full bg-[#050508] border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-cyber-blue text-sm transition-colors font-orbitron"
                                            />
                                            <Calendar className="absolute right-2 top-2 w-4 h-4 text-gray-500 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] text-gray-500 uppercase tracking-widest pl-1 mb-1 block">Body Weight (kg)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder={logs.length > 0 ? `${logs[logs.length - 1].weight}` : "e.g. 70.5"}
                                            value={weightInput}
                                            onChange={(e) => setWeightInput(e.target.value)}
                                            className="w-full bg-[#050508] border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-cyber-blue text-sm transition-colors font-orbitron"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="cyber-button w-full py-2.5 text-xs tracking-wider font-semibold font-orbitron"
                                    >
                                        {saving ? (
                                            <><Loader2 className="animate-spin mr-2 w-3.5 h-3.5" /> LOGGING...</>
                                        ) : (
                                            'RECORD WEIGHT'
                                        )}
                                    </button>
                                </form>
                            </div>

                            {/* History List */}
                            {logs.length > 0 && (
                                <div className="cyber-card p-4 border-gray-800/80 bg-[#0a0a0f]">
                                    <h3 className="font-orbitron text-gray-400 text-xs mb-3 uppercase tracking-wider">Log Entries</h3>
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                        {[...logs].reverse().map((log) => (
                                            <div key={log.id} className="flex justify-between items-center bg-[#050508] border border-gray-800/60 p-2.5 rounded text-xs">
                                                <div className="font-orbitron">
                                                    <span className="text-gray-400 block text-[9px] uppercase tracking-wider">
                                                        {new Date(log.log_date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                                    </span>
                                                    <span className="text-white font-bold">{log.weight} kg</span>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteLog(log.id)}
                                                    className="text-red-400 hover:text-red-500 p-1.5 rounded bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 active:scale-95 transition-all"
                                                    title="Delete Entry"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
