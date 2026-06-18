import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Loader2, Calendar } from 'lucide-react';

export default function PRHistory() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [prs, setPrs] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchPRs() {
            try {
                // Fetch all workout logs for user
                const { data: logs, error: logsError } = await supabase
                    .from('workout_logs')
                    .select('*')
                    .eq('user_id', user.id);

                if (logsError) throw logsError;

                // Fetch exercises to match names
                const { data: exercises, error: exError } = await supabase
                    .from('exercises')
                    .select('*');

                if (exError) throw exError;

                if (logs && exercises) {
                    const prMap = {};

                    logs.forEach(log => {
                        const exercise = exercises.find(e => e.id === log.exercise_id);
                        if (!exercise) return;

                        const exName = exercise.exercise_name;
                        if (!prMap[exName]) {
                            prMap[exName] = {
                                name: exName,
                                best_weight: 0,
                                best_volume: 0,
                                best_reps: 0,
                                date_weight: '',
                                date_volume: '',
                                date_reps: ''
                            };
                        }

                        const pr = prMap[exName];
                        const dateStr = log.workout_date;

                        if (log.set_logs && Array.isArray(log.set_logs)) {
                            log.set_logs.forEach(set => {
                                const w = parseFloat(set.weight) || 0;
                                const r = parseInt(set.reps, 10) || 0;
                                const vol = w * r;

                                if (w > pr.best_weight) {
                                    pr.best_weight = w;
                                    pr.date_weight = dateStr;
                                }
                                if (r > pr.best_reps) {
                                    pr.best_reps = r;
                                    pr.date_reps = dateStr;
                                }
                                if (vol > pr.best_volume) {
                                    pr.best_volume = vol;
                                    pr.date_volume = dateStr;
                                }
                            });
                        } else {
                            const w = parseFloat(log.weight_used) || 0;
                            const r = parseInt(log.actual_reps, 10) || 0;
                            const vol = w * r;

                            if (w > pr.best_weight) {
                                pr.best_weight = w;
                                pr.date_weight = dateStr;
                            }
                            if (r > pr.best_reps) {
                                pr.best_reps = r;
                                pr.date_reps = dateStr;
                            }
                            if (vol > pr.best_volume) {
                                pr.best_volume = vol;
                                pr.date_volume = dateStr;
                            }
                        }
                    });

                    // Convert map to array and filter out entries that have all zeros
                    const prList = Object.values(prMap).filter(
                        pr => pr.best_weight > 0 || pr.best_reps > 0 || pr.best_volume > 0
                    );

                    setPrs(prList);
                }
            } catch (err) {
                console.error(err);
                setError('Failed to fetch Personal Records.');
            } finally {
                setLoading(false);
            }
        }

        if (user) fetchPRs();
    }, [user]);

    const formatDateStr = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
            const date = new Date(dateStr);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${date.getDate()}-${months[date.getMonth()]}-${date.getFullYear()}`;
        } catch {
            return dateStr;
        }
    };

    if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-cyber-cyan w-10 h-10" /></div>;

    if (error) return <div className="text-red-400 text-center p-4 bg-red-500/10 rounded-lg">{error}</div>;

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="flex items-center space-x-3 mb-6 border-b border-cyber-blue/20 pb-4">
                <Trophy className="text-cyber-cyan w-8 h-8 drop-shadow-[0_0_10px_rgba(0,245,255,0.8)] animate-pulse" />
                <h1 className="text-2xl font-bold font-orbitron neon-text">Personal Records</h1>
            </div>

            {prs.length === 0 ? (
                <div className="text-center space-y-4 p-8 cyber-card border-dashed border-cyber-blue/40">
                    <Trophy className="w-16 h-16 text-gray-600 mx-auto opacity-50" />
                    <div>
                        <h2 className="text-xl font-orbitron text-gray-400">No Personal Records Yet</h2>
                        <p className="text-sm text-gray-500 mt-1">Complete workouts to start building your records.</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {prs.map((pr, index) => (
                        <div key={index} className="cyber-card p-4 border-cyber-blue/20 bg-[#0f0f15]">
                            <h3 className="font-orbitron font-bold text-white text-base border-b border-gray-800 pb-2 mb-3">
                                {pr.name}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-orbitron">
                                <div className="bg-[#09090f] border border-gray-800 p-3 rounded-lg flex flex-col justify-between">
                                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">Best Weight</span>
                                    <span className="text-xl font-bold text-cyber-cyan mt-1">{pr.best_weight} kg</span>
                                    <span className="text-[9px] text-gray-400 mt-2 flex items-center gap-1">
                                        <Calendar size={10} /> {formatDateStr(pr.date_weight)}
                                    </span>
                                </div>
                                <div className="bg-[#09090f] border border-gray-800 p-3 rounded-lg flex flex-col justify-between">
                                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">Best Volume</span>
                                    <span className="text-xl font-bold text-cyber-pink mt-1">{pr.best_volume}</span>
                                    <span className="text-[9px] text-gray-400 mt-2 flex items-center gap-1">
                                        <Calendar size={10} /> {formatDateStr(pr.date_volume)}
                                    </span>
                                </div>
                                <div className="bg-[#09090f] border border-gray-800 p-3 rounded-lg flex flex-col justify-between">
                                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">Best Reps</span>
                                    <span className="text-xl font-bold text-white mt-1">{pr.best_reps} Reps</span>
                                    <span className="text-[9px] text-gray-400 mt-2 flex items-center gap-1">
                                        <Calendar size={10} /> {formatDateStr(pr.date_reps)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
