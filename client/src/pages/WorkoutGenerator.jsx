import { useState, useContext } from 'react';
import Layout from '../components/Layout';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const WorkoutGenerator = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        age: '',
        height: '',
        weight: '',
        goal: 'Muscle Gain',
        level: 'Beginner',
        days_per_week: 3,
        time_per_session: 45
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            await axios.post('http://localhost:5000/api/workouts', formData, config);
            navigate('/dashboard'); // Or to /today-workout
        } catch (error) {
            console.error(error);
            alert('Error generating plan');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-2xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface p-8 rounded-2xl shadow-xl border border-gray-700"
                >
                    <h2 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Generate Your Plan</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-gray-400 mb-2">Age</label>
                                <input name="age" type="number" required className="w-full bg-background border border-gray-600 rounded-lg p-3 text-white focus:border-primary focus:outline-none" onChange={handleChange} />
                            </div>
                            <div>
                                <label className="block text-gray-400 mb-2">Height (cm)</label>
                                <input name="height" type="number" required className="w-full bg-background border border-gray-600 rounded-lg p-3 text-white focus:border-primary focus:outline-none" onChange={handleChange} />
                            </div>
                            <div>
                                <label className="block text-gray-400 mb-2">Weight (kg)</label>
                                <input name="weight" type="number" required className="w-full bg-background border border-gray-600 rounded-lg p-3 text-white focus:border-primary focus:outline-none" onChange={handleChange} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-400 mb-2">Fitness Goal</label>
                                <select name="goal" className="w-full bg-background border border-gray-600 rounded-lg p-3 text-white focus:border-primary focus:outline-none" onChange={handleChange} value={formData.goal}>
                                    <option value="Fat Loss">Fat Loss</option>
                                    <option value="Muscle Gain">Muscle Gain</option>
                                    <option value="Strength">Strength</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-400 mb-2">Experience Level</label>
                                <select name="level" className="w-full bg-background border border-gray-600 rounded-lg p-3 text-white focus:border-primary focus:outline-none" onChange={handleChange} value={formData.level}>
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-400 mb-2">Days per Week</label>
                                <select name="days_per_week" className="w-full bg-background border border-gray-600 rounded-lg p-3 text-white focus:border-primary focus:outline-none" onChange={handleChange} value={formData.days_per_week}>
                                    <option value="3">3 Days</option>
                                    <option value="4">4 Days</option>
                                    <option value="5">5 Days</option>
                                    <option value="6">6 Days</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-400 mb-2">Time per Session</label>
                                <select name="time_per_session" className="w-full bg-background border border-gray-600 rounded-lg p-3 text-white focus:border-primary focus:outline-none" onChange={handleChange} value={formData.time_per_session}>
                                    <option value="30">30 Minutes</option>
                                    <option value="45">45 Minutes</option>
                                    <option value="60">60 Minutes</option>
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-4 rounded-lg shadow-lg hover:shadow-primary/50 transition-all transform hover:translate-y-[-2px] disabled:opacity-50"
                        >
                            {loading ? 'Generating...' : 'Generate Plan'}
                        </button>
                    </form>
                </motion.div>
            </div>
        </Layout>
    );
};

export default WorkoutGenerator;
