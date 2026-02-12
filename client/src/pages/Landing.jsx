import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dumbbell, Utensils, TrendingUp, CheckCircle, ArrowRight, Zap, Shield, Cpu, Sparkles } from 'lucide-react';

const FeatureCard = ({ icon, title, description, color }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="bg-slate-900/50 backdrop-blur-sm p-8 rounded-3xl border border-white/5 hover:border-white/10 transition-all shadow-xl hover:shadow-cyan-500/10 group"
    >
        <div className={`mb - 6 p - 4 rounded - 2xl bg - gradient - to - br ${color} text - white w - fit shadow - lg shadow - black / 20 group - hover: scale - 110 transition - transform duration - 300`}>
            {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors feature-title">{title}</h3>
        <p className="text-slate-400 leading-relaxed font-light">{description}</p>
    </motion.div>
);

const Landing = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] right-[-20%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
            </div>

            {/* Navbar */}
            <nav className="flex justify-between items-center p-6 container mx-auto relative z-10">
                <div className="flex items-center gap-2">
                    <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-2 rounded-lg">
                        <Dumbbell size={24} className="text-white" />
                    </div>
                    <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-200 to-blue-400 tracking-tight">
                        GymPilot
                    </span>
                </div>
                <div className="flex gap-4">
                    <Link to="/login" className="px-5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all font-medium border border-transparent hover:border-white/10">
                        Login
                    </Link>
                    <Link to="/register" className="px-5 py-2.5 rounded-xl bg-white text-slate-950 hover:bg-cyan-50 font-bold transition-all shadow-lg hover:shadow-cyan-500/20 transform hover:-translate-y-0.5">
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center container mx-auto px-6 py-12 text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-5xl mx-auto space-y-8"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-semibold mb-6">
                        <Sparkles size={16} />
                        <span>AI-Powered Fitness Generation 2.0</span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black leading-tight tracking-tight">
                        Forge Your <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 animate-gradient-x">Perfect Body</span>
                    </h1>

                    <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-light">
                        Experience the future of personal training. GymPilot uses advanced AI to build custom workout plans, track nutrition, and visualize your evolution.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-5 justify-center pt-10">
                        <Link to="/register" className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
                            Start Your Free Trial <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link to="/login" className="px-8 py-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-white font-bold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                            <Cpu size={20} /> How AI Works
                        </Link>
                    </div>
                </motion.div>

                {/* Stats / Trust */}
                <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 border-t border-white/5 pt-12 w-full max-w-4xl opacity-70">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-white mb-1">10k+</div>
                        <div className="text-slate-500 text-sm uppercase tracking-wider font-semibold">Users Active</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-white mb-1">50k+</div>
                        <div className="text-slate-500 text-sm uppercase tracking-wider font-semibold">Plans Generated</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-white mb-1">99%</div>
                        <div className="text-slate-500 text-sm uppercase tracking-wider font-semibold">Goal Success</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-white mb-1">24/7</div>
                        <div className="text-slate-500 text-sm uppercase tracking-wider font-semibold">AI Support</div>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-6 mt-32 w-full max-w-7xl px-4">
                    <FeatureCard
                        icon={<Zap size={32} />}
                        title="Smart Workout AI"
                        description="Algorithms that adapt to your strength levels and recovery in real-time."
                        color="from-cyan-500 to-blue-600"
                    />
                    <FeatureCard
                        icon={<Shield size={32} />}
                        title="Precision Nutrition"
                        description="Macro-perfect meal plans designed to fuel your specific metabolic needs."
                        color="from-purple-500 to-indigo-600"
                    />
                    <FeatureCard
                        icon={<TrendingUp size={32} />}
                        title="Predictive Analytics"
                        description="Visualize your future gains with advanced progression modeling."
                        color="from-emerald-400 to-teal-600"
                    />
                </div>
            </main>

            {/* Footer */}
            <footer className="py-10 border-t border-white/5 text-center text-slate-600 text-sm relative z-10">
                <p>&copy; {new Date().getFullYear()} GymPilot AI. Engineered for performance.</p>
            </footer>
        </div>
    );
};

export default Landing;
