import { useState, useEffect, useContext } from 'react';
import Layout from '../components/Layout';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

const DietLog = () => {
    const { user } = useContext(AuthContext);
    const [logs, setLogs] = useState([]);
    const [totalProtein, setTotalProtein] = useState(0);
    const [formData, setFormData] = useState({
        meal_type: 'Breakfast',
        item_name: '',
        protein: ''
    });

    useEffect(() => {
        fetchDietLogs();
    }, []);

    const fetchDietLogs = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get('http://localhost:5000/api/diet', config);
            setLogs(data.logs);
            setTotalProtein(data.totalProtein);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post('http://localhost:5000/api/diet', formData, config);
            setFormData({ meal_type: 'Breakfast', item_name: '', protein: '' });
            fetchDietLogs();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">Diet & Nutrition Log</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1">
                        <div className="bg-surface p-6 rounded-xl border border-gray-700 shadow-lg sticky top-6">
                            <h3 className="text-xl font-bold mb-4 text-white">Daily Summary</h3>
                            <div className="mb-4">
                                <div className="text-gray-400 text-sm">Total Protein</div>
                                <div className="text-4xl font-bold text-primary">{totalProtein}g</div>
                            </div>
                            {/* Add more stats if needed */}
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-surface p-6 rounded-xl border border-gray-700"
                        >
                            <h3 className="text-xl font-bold mb-4 text-white">Add Meal</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Meal Type</label>
                                    <select
                                        value={formData.meal_type}
                                        onChange={(e) => setFormData({ ...formData, meal_type: e.target.value })}
                                        className="w-full bg-background border border-gray-600 rounded p-3 text-white focus:border-primary focus:outline-none"
                                    >
                                        <option>Breakfast</option>
                                        <option>Lunch</option>
                                        <option>Dinner</option>
                                        <option>Snacks</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Food Item</label>
                                    <input
                                        type="text"
                                        value={formData.item_name}
                                        onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                                        placeholder="e.g. 2 Eggs, Whey Protein"
                                        className="w-full bg-background border border-gray-600 rounded p-3 text-white focus:border-primary focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Protein (g)</label>
                                    <input
                                        type="number"
                                        value={formData.protein}
                                        onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                                        className="w-full bg-background border border-gray-600 rounded p-3 text-white focus:border-primary focus:outline-none"
                                        required
                                    />
                                </div>
                                <button type="submit" className="w-full bg-primary hover:bg-blue-600 text-white p-3 rounded-lg font-bold flex items-center justify-center gap-2">
                                    <Plus size={20} /> Add to Log
                                </button>
                            </form>
                        </motion.div>

                        <div className="bg-surface p-6 rounded-xl border border-gray-700">
                            <h3 className="text-xl font-bold mb-4 text-white">Today's Meals</h3>
                            <div className="space-y-4">
                                {logs.length === 0 ? (
                                    <div className="text-gray-500 text-center py-4">No meals logged yet.</div>
                                ) : (
                                    logs.map((log) => (
                                        <div key={log.id} className="flex justify-between items-center bg-background p-4 rounded-lg border border-gray-800">
                                            <div>
                                                <div className="font-bold text-white">{log.item_name}</div>
                                                <div className="text-xs text-gray-400">{log.meal_type}</div>
                                            </div>
                                            <div className="text-primary font-bold">{log.protein}g Protein</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default DietLog;
