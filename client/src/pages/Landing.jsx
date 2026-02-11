import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dumbbell, Utensils, TrendingUp, CheckCircle } from 'lucide-react';

const FeatureCard = ({ icon, title, description }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="bg-surface p-6 rounded-2xl border border-gray-700 hover:border-primary/50 transition-all shadow-lg hover:shadow-primary/10"
    >
        <div className="mb-4 text-primary bg-primary/10 w-fit p-3 rounded-xl">{icon}</div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
    </motion.div>
);

const Landing = () => {
    return (
        <div className="min-h-screen bg-background text-text flex flex-col">
            {/* Navbar */}
            <nav className="flex justify-between items-center p-6 container mx-auto">
                <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary flex items-center gap-2">
                    <Dumbbell size={32} className="text-primary" />
                    GymPilot
                </div>
                <div className="flex gap-4">
                    <Link to="/login" className="px-6 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-surface transition-colors border border-transparent hover:border-gray-700">
                        Login
                    </Link>
                    <Link to="/register" className="px-6 py-2 rounded-lg bg-primary hover:bg-blue-600 text-white font-medium transition-transform transform hover:scale-105 shadow-lg shadow-primary/25">
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center container mx-auto px-6 py-12 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-4xl mx-auto space-y-6"
                >
                    <span className="px-4 py-2 rounded-full bg-surface border border-primary/30 text-primary text-sm font-medium inline-block mb-4">
                        AI-Powered Fitness Revolution 🚀
                    </span>
                    <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">
                        Your Personal <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">AI Trainer</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        GymPilot creates personalized workout plans, tracks your nutrition, and visualizes your progress—all powered by advanced AI.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                        <Link to="/register" className="px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white font-bold text-lg hover:shadow-lg hover:shadow-primary/40 transition-all transform hover:-translate-y-1">
                            Start Your Journey Free
                        </Link>
                        <Link to="/login" className="px-8 py-4 rounded-xl bg-surface border border-gray-700 text-white font-bold text-lg hover:bg-gray-800 transition-all">
                            Existing User? Login
                        </Link>
                    </div>
                </motion.div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-8 mt-24 w-full max-w-6xl">
                    <FeatureCard
                        icon={<Dumbbell size={32} />}
                        title="Smart Workouts"
                        description="Get weekly workout plans tailored to your specific goals, equipment, and schedule."
                    />
                    <FeatureCard
                        icon={<Utensils size={32} />}
                        title="Nutrition Tracking"
                        description="Log meals easily and track your macros to ensure you're fueling your body right."
                    />
                    <FeatureCard
                        icon={<TrendingUp size={32} />}
                        title="Progress Analytics"
                        description="Visualize your strength gains and body transformation with intuitive charts."
                    />
                </div>
            </main>

            {/* Footer */}
            <footer className="py-8 border-t border-gray-800 text-center text-gray-500">
                <p>&copy; {new Date().getFullYear()} GymPilot. built for greatness.</p>
            </footer>
        </div>
    );
};

export default Landing;
