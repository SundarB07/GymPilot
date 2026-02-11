import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dumbbell, Calendar, Utensils, TrendingUp } from 'lucide-react';

const Dashboard = () => {
    const options = [
        {
            title: 'Generate Workout Plan',
            icon: <Calendar size={40} />,
            link: '/generate-plan',
            desc: 'Create a personalized weekly split based on your goals.',
            color: 'from-blue-500 to-cyan-500'
        },
        {
            title: "Today's Workout",
            icon: <Dumbbell size={40} />,
            link: '/today-workout',
            desc: 'View your exercises for today and log your progress.',
            color: 'from-green-500 to-emerald-500'
        },
        {
            title: 'Food Log',
            icon: <Utensils size={40} />,
            link: '/diet-log',
            desc: 'Track your meals and protein intake.',
            color: 'from-orange-500 to-red-500'
        },
        {
            title: 'Progress Gallery',
            icon: <TrendingUp size={40} />,
            link: '/progress',
            desc: 'Visualize your physical transformation over time.',
            color: 'from-purple-500 to-pink-500'
        },
    ];

    return (
        <Layout>
            <div className="flex flex-col gap-8">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-10"
                >
                    <h1 className="text-4xl md:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary mb-4">
                        Welcome to GymPilot
                    </h1>
                    <p className="text-xl text-gray-400">Your AI-Powered Personal Trainer</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-5xl mx-auto w-full">
                    {options.map((opt, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Link to={opt.link} className="block h-full">
                                <div className={`h-full bg-surface border border-gray-700 p-8 rounded-2xl hover:border-gray-500 transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] bg-gradient-to-br ${opt.color} bg-opacity-10 hover:bg-opacity-20 relative overflow-hidden group`}>
                                    <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity bg-gradient-to-br ${opt.color} rounded-bl-3xl`}>
                                        {opt.icon}
                                    </div>
                                    <div className="mb-4 text-white p-3 bg-gray-800/50 rounded-xl w-fit">
                                        {opt.icon}
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">{opt.title}</h3>
                                    <p className="text-gray-400">{opt.desc}</p>
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
