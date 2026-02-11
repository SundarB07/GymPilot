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
    const [logs, setLogs] = useState({});

    useEffect(() => {
        fetchTodayWorkout();
    }, []);

    const fetchTodayWorkout = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get('http://localhost:5000/api/workouts/today', config);
            setWorkout(data);

            // Initialize logs state
            if (data.exercises) {
                const initialLogs = {};
                data.exercises.forEach(ex => {
                    initialLogs[ex.name] = {
                        sets: ex.sets,
                        reps: ex.reps, // target reps
                        weight: ex.suggestedWeight,
                        completed: true
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

    const handleLogChange = (exerciseName, field, value) => {
        setLogs(prev => ({
            ...prev,
            [exerciseName]: {
                ...prev[exerciseName],
                [field]: value
            }
        }));
    };

    const handleSubmit = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const exercisesToLog = Object.keys(logs).map(name => ({
                name,
                ...logs[name]
            }));

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
            <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Today's Workout: {workout?.day}</h2>

                {workout?.isRestDay ? (
                    <div className="text-center p-10 bg-surface rounded-2xl border border-gray-700">
                        <h3 className="text-2xl text-green-400 mb-4">Rest Day</h3>
                        <p className="text-gray-400">{workout.message}</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {workout?.exercises?.map((ex, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-surface p-6 rounded-xl border border-gray-700 shadow-lg"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold text-white">{ex.name}</h3>
                                    <div className="text-sm text-gray-400">Target: {ex.sets} sets x {ex.reps} reps @ {ex.suggestedWeight}kg</div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Weight</label>
                                        <input
                                            type="number"
                                            value={logs[ex.name]?.weight || ''}
                                            onChange={(e) => handleLogChange(ex.name, 'weight', parseFloat(e.target.value))}
                                            className="w-full bg-background border border-gray-600 rounded p-2 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Sets</label>
                                        <input
                                            type="number"
                                            value={logs[ex.name]?.sets || ''}
                                            onChange={(e) => handleLogChange(ex.name, 'sets', parseInt(e.target.value))}
                                            className="w-full bg-background border border-gray-600 rounded p-2 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Reps</label>
                                        <input
                                            type="number"
                                            value={logs[ex.name]?.reps || ''}
                                            onChange={(e) => handleLogChange(ex.name, 'reps', e.target.value)} // keep as string to allow ranges if needed, but validation might need number
                                            className="w-full bg-background border border-gray-600 rounded p-2 text-white"
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleLogChange(ex.name, 'completed', !logs[ex.name]?.completed)}
                                        className={`p-2 rounded flex items-center justify-center gap-2 ${logs[ex.name]?.completed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                                    >
                                        {logs[ex.name]?.completed ? <CheckCircle size={20} /> : <XCircle size={20} />}
                                        {logs[ex.name]?.completed ? 'Done' : 'Failed'}
                                    </button>
                                </div>
                            </motion.div>
                        ))}

                        <button
                            onClick={handleSubmit}
                            className="w-full bg-gradient-to-r from-primary to-secondary p-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-primary/40 transition-all"
                        >
                            Finish Workout
                        </button>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default TodayWorkout;
