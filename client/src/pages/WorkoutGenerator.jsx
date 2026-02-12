import { useState, useContext } from 'react';
import Layout from '../components/Layout';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings, RefreshCw, Calendar, Dumbbell, CheckCircle2 } from 'lucide-react';

const WorkoutGenerator = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('input'); // 'input' | 'preview'
    const [mode, setMode] = useState('auto'); // 'auto' | 'custom'
    const [previewData, setPreviewData] = useState(null);
    const [customDays, setCustomDays] = useState(3);
    const [customSchedule, setCustomSchedule] = useState({
        'Day 1': 'Chest',
        'Day 2': 'Back',
        'Day 3': 'Legs'
    });

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

    const handleCustomDayChange = (day, value) => {
        setCustomSchedule({ ...customSchedule, [day]: value });
    };

    const handleCustomDaysCountChange = (e) => {
        const count = parseInt(e.target.value);
        setCustomDays(count);
        // Reset/Adjust schedule based on new count
        const newSchedule = {};
        for (let i = 1; i <= count; i++) {
            const dayKey = `Day ${i}`;
            newSchedule[dayKey] = customSchedule[dayKey] || 'Rest';
        }
        setCustomSchedule(newSchedule);
    };

    const handlePreview = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            // If "Varies" is selected (value "varies"), backend defaults to standard structure (60)
            // We just send the value, backend can handle parsing or we map it here.
            // Let's map "varies" to 60 for generation purposes if needed, 
            // but the prompt says they just want the option. 
            // The backend generator currently expects a number for logic, but for "Varies" generic is fine.
            const payload = { ...formData };
            // Ensure numbers are actually numbers
            payload.days_per_week = parseInt(payload.days_per_week);
            payload.age = parseInt(payload.age);
            payload.height = parseInt(payload.height);
            payload.weight = parseInt(payload.weight);

            if (payload.time_per_session === 'varies') {
                payload.time_per_session = 60;
            } else {
                payload.time_per_session = parseInt(payload.time_per_session);
            }

            if (mode === 'custom') {
                payload.customSchedule = customSchedule;
                payload.days_per_week = customDays;
            }

            const { data } = await axios.post('http://localhost:5000/api/workouts/preview', payload, config);
            setPreviewData(data);
            setStep('preview');
        } catch (error) {
            console.error(error);
            alert('Error generating preview');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            // Re-sending to create (stateless)
            // Re-sending to create (stateless)
            const payload = { ...formData };
            if (payload.time_per_session === 'varies') payload.time_per_session = 60;

            if (mode === 'custom') {
                payload.customSchedule = customSchedule;
                payload.days_per_week = customDays;
            }

            await axios.post('http://localhost:5000/api/workouts', payload, config);
            navigate('/dashboard');
        } catch (error) {
            console.error(error);
            alert('Error saving plan');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface p-8 rounded-2xl shadow-xl border border-gray-700"
                >
                    <h2 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                        {step === 'input' ? 'Generate Your Plan' : 'Preview Your Plan'}
                    </h2>

                    {step === 'input' ? (
                        <form onSubmit={handlePreview} className="space-y-5">

                            {/* Mode Toggle */}
                            <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-700 w-full max-w-md mx-auto mb-8">
                                <button
                                    type="button"
                                    onClick={() => setMode('auto')}
                                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${mode === 'auto' ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                >
                                    <RefreshCw size={18} /> Auto Generate
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('custom')}
                                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${mode === 'custom' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                >
                                    <Settings size={18} /> Custom Split
                                </button>
                            </div>

                            {/* Common Details */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-gray-400 mb-2 text-sm font-medium">Age</label>
                                    <input name="age" type="number" required className="w-full bg-background border border-gray-600 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors" onChange={handleChange} value={formData.age} placeholder="e.g. 25" />
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-2 text-sm font-medium">Height (cm)</label>
                                    <input name="height" type="number" required className="w-full bg-background border border-gray-600 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors" onChange={handleChange} value={formData.height} placeholder="e.g. 175" />
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-2 text-sm font-medium">Weight (kg)</label>
                                    <input name="weight" type="number" required className="w-full bg-background border border-gray-600 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors" onChange={handleChange} value={formData.weight} placeholder="e.g. 70" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-400 mb-2 text-sm font-medium">Fitness Goal</label>
                                    <select name="goal" className="w-full bg-background border border-gray-600 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors" onChange={handleChange} value={formData.goal}>
                                        <option value="Fat Loss">Fat Loss</option>
                                        <option value="Muscle Gain">Muscle Gain</option>
                                        <option value="Strength">Strength</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-2 text-sm font-medium">Experience Level</label>
                                    <select name="level" className="w-full bg-background border border-gray-600 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors" onChange={handleChange} value={formData.level}>
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                    </select>
                                </div>
                            </div>

                            {mode === 'auto' ? (
                                /* Auto Mode Specifics */
                                <div key="auto-mode" className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                                    <div>
                                        <label className="block text-gray-400 mb-2 text-sm font-medium">Days per Week</label>
                                        <select name="days_per_week" className="w-full bg-background border border-gray-600 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors" onChange={handleChange} value={formData.days_per_week}>
                                            <option value="3">3 Days (Full Body)</option>
                                            <option value="4">4 Days (Upper/Lower)</option>
                                            <option value="5">5 Days (PPL Split)</option>
                                            <option value="6">6 Days (PPL x2)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 mb-2 text-sm font-medium">Time per Session</label>
                                        <select name="time_per_session" className="w-full bg-background border border-gray-600 rounded-lg p-3 text-white focus:border-primary focus:outline-none transition-colors" onChange={handleChange} value={formData.time_per_session}>
                                            <option value="30">30 Minutes</option>
                                            <option value="45">45 Minutes</option>
                                            <option value="60">60 Minutes</option>
                                            <option value="varies">Varies / Flexible</option>
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                /* Custom Mode Specifics */
                                <div key="custom-mode" className="space-y-6 animate-fadeIn">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between border-b border-gray-700 pb-2 mb-4">
                                            <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Calendar className="text-blue-400" size={20} /> Customize Schedule</h3>
                                            <div className="flex items-center gap-2">
                                                <label className="text-sm text-gray-400">Total Days:</label>
                                                <select
                                                    value={customDays}
                                                    onChange={handleCustomDaysCountChange}
                                                    className="bg-slate-900 border border-slate-700 rounded-lg py-1 px-3 text-white text-sm focus:border-blue-500 outline-none"
                                                >
                                                    {[1, 2, 3, 4, 5, 6, 7].map(num => (
                                                        <option key={num} value={num}>{num} Days</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                            {Array.from({ length: customDays }).map((_, idx) => {
                                                const dayNum = idx + 1;
                                                const dayKey = `Day ${dayNum}`;
                                                return (
                                                    <div key={dayKey} className="flex items-center justify-between bg-slate-900/50 p-3 rounded-xl border border-slate-800 hover:border-slate-600 transition-colors">
                                                        <span className="text-slate-300 font-medium">Day {dayNum}</span>
                                                        <select
                                                            value={customSchedule[dayKey] || 'Rest'}
                                                            onChange={(e) => handleCustomDayChange(dayKey, e.target.value)}
                                                            className="bg-background border border-slate-700 rounded-lg py-2 px-3 text-white text-sm focus:border-blue-500 outline-none w-[180px]"
                                                        >
                                                            <option value="Rest">Rest Day</option>
                                                            <option value="Chest">Chest</option>
                                                            <option value="Back">Back</option>
                                                            <option value="Legs">Legs</option>
                                                            <option value="Shoulders">Shoulders</option>
                                                            <option value="Arms">Arms</option>
                                                            <option value="Push">Push</option>
                                                            <option value="Pull">Pull</option>
                                                            <option value="Upper Body">Upper Body</option>
                                                            <option value="Lower Body">Lower Body</option>
                                                            <option value="Full Body">Full Body</option>
                                                            <option value="Cardio">Cardio</option>
                                                            <option value="Abs/Core">Abs / Core</option>
                                                        </select>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:translate-y-[-2px] disabled:opacity-50 flex items-center justify-center gap-2 ${mode === 'custom' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-cyan-500/20' : 'bg-gradient-to-r from-primary to-secondary hover:shadow-primary/50'}`}
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</span>
                                ) : (
                                    <>Generate Preview <CheckCircle2 size={20} /></>
                                )}
                            </button>
                        </form>
                    ) : (
                        // Preview Step
                        <div className="space-y-6">
                            <div className="p-4 bg-background/50 rounded-lg border border-gray-700">
                                <h3 className="text-xl font-bold text-white mb-2 underline decoration-primary decoration-2 underline-offset-4">{previewData?.splitType} Split</h3>
                                <p className="text-gray-400">{previewData?.description}</p>
                            </div>

                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {Object.entries(previewData?.schedule || {}).map(([day, dayData]) => {
                                    // Handle both old (Array) and new (Object) structures for robustness
                                    const isArray = Array.isArray(dayData);
                                    const focus = isArray ? null : dayData.focus;
                                    const exerciseCount = isArray ? dayData.length : (dayData?.exercises?.length || 0);

                                    const displayText = focus || (exerciseCount > 0 ? `${exerciseCount} Exercises` : 'Rest Day');

                                    return (
                                        <div key={day} className="bg-background p-4 rounded-xl border border-gray-800 flex justify-between items-center hover:border-primary/30 transition-colors">
                                            <h4 className="font-bold text-primary text-lg">{day}</h4>
                                            <div className="text-white font-medium bg-surface/50 px-4 py-2 rounded-lg border border-white/5">
                                                {displayText}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setStep('input')}
                                    className="flex-1 py-3 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors font-semibold"
                                >
                                    Cancel & Edit
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={loading}
                                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-green-500/30 transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : 'Confirm & Save Plan'}
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </Layout>
    );
};

export default WorkoutGenerator;
