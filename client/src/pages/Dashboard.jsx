import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dumbbell, Calendar, Utensils, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';

const Dashboard = () => {
    const options = [
        {
            title: 'Generate Workout Plan',
            icon: <Calendar size={32} />,
            link: '/generate-plan',
            desc: 'Create a personalized weekly split based on your goals.',
            color: 'from-cyan-500 to-blue-600',
            glow: 'shadow-cyan-500/20'
        },
        {
            title: "Today's Workout",
            icon: <Dumbbell size={32} />,
            link: '/today-workout',
            desc: 'View your exercises for today and log your progress.',
            color: 'from-purple-500 to-indigo-600',
            glow: 'shadow-purple-500/20'
        },
        {
            title: 'Food Log',
            icon: <Utensils size={32} />,
            link: '/diet-log',
            desc: 'Track your meals and protein intake.',
            color: 'from-pink-500 to-rose-600',
            glow: 'shadow-pink-500/20'
        },
        {
            title: 'Progress Gallery',
            icon: <TrendingUp size={32} />,
            link: '/progress',
            desc: 'Visualize your physical transformation over time.',
            color: 'from-emerald-400 to-teal-600',
            glow: 'shadow-emerald-500/20'
        },
    ];

    return (
        <Layout>
            <div className="flex flex-col gap-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center py-10 relative"
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

                    <h1 className="text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 mb-4 tracking-tight drop-shadow-sm">
                        Welcome to GymPilot
                    </h1>
                    <p className="text-xl text-slate-400 flex items-center justify-center gap-2">
                        Your AI-Powered Personal Trainer <Sparkles size={20} className="text-yellow-400" />
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto w-full px-4">
                    {options.map((opt, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Link to={opt.link} className="block group h-full">
                                <div className={`h-full bg-slate-900/60 backdrop-blur-md border border-white/5 p-8 rounded-3xl transition-all duration-300 hover:border-white/20 hover:bg-slate-900/80 relative overflow-hidden group-hover:transform group-hover:-translate-y-1 group-hover:shadow-2xl ${opt.glow}`}>

                                    {/* Gradient Overlay on Hover */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${opt.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                                    <div className="flex items-start justify-between mb-6">
                                        <div className={`p-4 rounded-2xl bg-gradient-to-br ${opt.color} text-white shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-300`}>
                                            {opt.icon}
                                        </div>
                                        <ArrowRight className="text-slate-600 group-hover:text-white transition-colors transform group-hover:translate-x-1" />
                                    </div>

                                    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-colors">
                                        {opt.title}
                                    </h3>
                                    <p className="text-slate-400 leading-relaxed font-light">
                                        {opt.desc}
                                    </p>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;
