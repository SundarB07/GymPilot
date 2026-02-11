import { useState, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await register(username, email, password);
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background bg-gradient-to-br from-gray-900 via-gray-800 to-black">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700 backdrop-blur-sm bg-opacity-90"
            >
                <h2 className="text-3xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-secondary to-green-400">Join GymPilot</h2>
                {error && <div className="bg-red-500/20 text-red-300 p-3 rounded mb-4 text-center">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-400 mb-1">Username</label>
                        <input
                            type="text"
                            className="w-full bg-background border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-secondary transition-colors"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full bg-background border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-secondary transition-colors"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 mb-1">Password</label>
                        <input
                            type="password"
                            className="w-full bg-background border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-secondary transition-colors"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-secondary to-green-600 hover:to-green-700 text-white font-bold py-3 rounded-lg shadow-lg transform transition hover:scale-[1.02]"
                    >
                        Register
                    </button>
                </form>

                <p className="text-center mt-6 text-gray-400">
                    Already have an account? <Link to="/login" className="text-secondary hover:text-green-400">Login here</Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Register;
