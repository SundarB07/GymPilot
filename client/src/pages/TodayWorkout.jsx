import { useState, useEffect, useContext } from 'react';
import Layout from '../components/Layout';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';

const TodayWorkout = () => {
    const { user } = useContext(AuthContext);
    const [workout, setWorkout] = useState(null);
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState({}); // { exerciseName: { sets: [{weight, reps, completed}, ...], finished: false } }

    useEffect(() => {
        fetchTodayWorkout();
    }, []);

    const fetchTodayWorkout = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get('http://localhost:5000/api/workouts/today', config);
            setWorkout(data);

            // Initialize logs state with rows for each set
            if (data.exercises) {
                const initialLogs = {};
                data.exercises.forEach(ex => {
                    const sets = [];
                    // Create a row for each target set
                    for (let i = 0; i < (ex.sets || 3); i++) {
                        sets.push({
                            setNumber: i + 1,
                            weight: '', // Clear for user input
                            reps: '',   // Clear for user input
                            targetWeight: ex.suggestedWeight || 0,
                            targetReps: ex.reps || 10,
                            completed: false
                        });
                    }
                    initialLogs[ex.name] = {
                        sets: sets,
                        finished: false
                    };
                });
                setLogs(initialLogs);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSetChange = (exerciseName, setIndex, field, value) => {
        setLogs(prev => {
            const exerciseLog = { ...prev[exerciseName] };
            const newSets = [...exerciseLog.sets];
            newSets[setIndex] = { ...newSets[setIndex], [field]: value };
            exerciseLog.sets = newSets;
            return { ...prev, [exerciseName]: exerciseLog };
        });
    };

    const toggleSetCompletion = (exerciseName, setIndex) => {
        const currentSet = logs[exerciseName].sets[setIndex];
        // Validation: Ensure valid reps and weight before marking as done
        if (!currentSet.completed) {
            if (!currentSet.reps || parseInt(currentSet.reps) <= 0) {
                alert("Please enter a valid number of reps");
                return;
            }
            if (!currentSet.weight || parseFloat(currentSet.weight) <= 0) {
                alert("Please enter a valid weight");
                return;
            }
        }

        setLogs(prev => {
            const exerciseLog = { ...prev[exerciseName] };
            const newSets = [...exerciseLog.sets];
            newSets[setIndex] = { ...newSets[setIndex], completed: !newSets[setIndex].completed };
            exerciseLog.sets = newSets;

            // Check if all sets are completed to mark exercise as finished?
            // Optional: Auto-finish could be annoying, let's keep it manual or visual only.

            return { ...prev, [exerciseName]: exerciseLog };
        });
    };

    const addSet = (exerciseName) => {
        setLogs(prev => {
            const exerciseLog = { ...prev[exerciseName] };
            const lastSet = exerciseLog.sets[exerciseLog.sets.length - 1];
            const newSet = {
                setNumber: exerciseLog.sets.length + 1,
                weight: lastSet ? lastSet.weight : 0,
                reps: lastSet ? lastSet.reps : 10,
                completed: false
            };
            exerciseLog.sets = [...exerciseLog.sets, newSet];
            return { ...prev, [exerciseName]: exerciseLog };
        });
    };

    const removeSet = (exerciseName) => {
        setLogs(prev => {
            const exerciseLog = { ...prev[exerciseName] };
            if (exerciseLog.sets.length <= 1) return prev; // Keep at least one set
            const newSets = exerciseLog.sets.slice(0, -1);
            exerciseLog.sets = newSets;
            return { ...prev, [exerciseName]: exerciseLog };
        });
    };

    const handleSubmit = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const exercisesToLog = Object.keys(logs).map(name => {
                const logData = logs[name];

                return {
                    name,
                    sets: logData.sets.length,
                    reps: 0,
                    weight: 0,
                    completed: true,
                    log_data: logData.sets.map(s => ({
                        set: s.setNumber,
                        weight: s.weight === '' ? (s.targetWeight || 0) : s.weight,
                        reps: s.reps === '' ? (s.targetReps || 0) : s.reps,
                        completed: s.completed
                    }))
                };
            });

            await axios.post('http://localhost:5000/api/workouts/log', { exercises: exercisesToLog }, config);
            alert('Workout Logged Successfully!');
        } catch (error) {
            console.error(error);
            alert('Failed to log workout');
        }
    };

    if (loading) return <Layout><div className="text-center mt-10">Loading...</div></Layout>;

    return (
        <Layout>
            <div className="max-w-4xl mx-auto pb-20">
                <h2 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Today's Workout: {workout?.day}</h2>

                {
                    workout?.isRestDay ? (
                        <div className="text-center p-10 bg-surface rounded-2xl border border-gray-700">
                            <h3 className="text-2xl text-green-400 mb-4">Rest Day</h3>
                            <p className="text-gray-400">{workout.message}</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {workout?.exercises?.map((ex, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-surface p-6 rounded-xl border border-gray-700 shadow-lg"
                                >
                                    <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-white">{ex.name}</h3>
                                            <div className="text-sm text-gray-400 mt-1">Target: {ex.sets} sets x {ex.reps} reps</div>
                                        </div>
                                        <div className="text-primary font-bold bg-primary/10 px-3 py-1 rounded-lg border border-primary/20">
                                            Suggest: {ex.suggestedWeight}kg
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {/* Header Row */}
                                        <div className="grid grid-cols-10 gap-2 text-xs text-gray-400 font-medium uppercase tracking-wider text-center mb-2 px-2">
                                            <div className="col-span-1">Set</div>
                                            <div className="col-span-3">kg</div>
                                            <div className="col-span-3">Reps</div>
                                            <div className="col-span-3">Status</div>
                                        </div>

                                        {/* Set Rows */}
                                        {logs[ex.name]?.sets.map((set, setIdx) => (
                                            <div key={setIdx} className={`grid grid-cols-10 gap-2 items-center p-2 rounded-lg transition-colors ${set.completed ? 'bg-green-500/10 border border-green-500/30' : 'bg-background/50 border border-gray-700'}`}>
                                                <div className="col-span-1 text-center font-bold text-gray-400">{set.setNumber}</div>
                                                <div className="col-span-3">
                                                    <input
                                                        type="number"
                                                        value={set.weight}
                                                        placeholder={set.targetWeight}
                                                        onChange={(e) => handleSetChange(ex.name, setIdx, 'weight', e.target.value)}
                                                        className="w-full bg-slate-900 border border-gray-600 rounded p-2 text-center text-white focus:border-primary outline-none placeholder:text-gray-600"
                                                    />
                                                </div>
                                                <div className="col-span-3">
                                                    <input
                                                        type="number"
                                                        value={set.reps}
                                                        placeholder={set.targetReps}
                                                        onChange={(e) => handleSetChange(ex.name, setIdx, 'reps', e.target.value)}
                                                        className="w-full bg-slate-900 border border-gray-600 rounded p-2 text-center text-white focus:border-primary outline-none placeholder:text-gray-600"
                                                    />
                                                </div>
                                                <div className="col-span-3">
                                                    <button
                                                        onClick={() => toggleSetCompletion(ex.name, setIdx)}
                                                        className={`w-full py-2 rounded font-medium flex items-center justify-center transition-colors ${set.completed ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                                                    >
                                                        {set.completed ? <CheckCircle size={16} /> : 'Done?'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-3 mt-4">
                                        <button
                                            onClick={() => addSet(ex.name)}
                                            className="text-xs font-medium text-gray-400 hover:text-white flex items-center gap-1 py-2 px-3 rounded hover:bg-gray-800 transition-colors"
                                        >
                                            + Add Set
                                        </button>
                                        <button
                                            onClick={() => removeSet(ex.name)}
                                            className="text-xs font-medium text-red-400 hover:text-red-300 flex items-center gap-1 py-2 px-3 rounded hover:bg-red-900/20 transition-colors"
                                        >
                                            - Remove Set
                                        </button>
                                    </div>
                                </motion.div>
                            ))}

                            <button
                                onClick={handleSubmit}
                                className="w-full bg-gradient-to-r from-primary to-secondary p-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-primary/40 transition-all text-white flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={24} /> Finish Workout
                            </button>
                        </div>
                    )
                }
            </div >
        </Layout >
    );
};

export default TodayWorkout;
