import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signUp } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        if (password !== passwordConfirm) {
            return setError('Passwords do not match');
        }

        try {
            setError('');
            setLoading(true);
            const { error: signUpError } = await signUp(email, password, username);
            if (signUpError) throw signUpError;
            navigate('/');
        } catch (err) {
            setError(err.message || 'Failed to create an account');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-md cyber-card space-y-8">
                <div className="text-center flex flex-col items-center">
                    <Dumbbell className="text-cyber-cyan w-16 h-16 drop-shadow-[0_0_15px_rgba(0,245,255,0.8)] mb-4" />
                    <h2 className="text-3xl font-orbitron font-bold neon-text">GymPilot</h2>
                    <p className="text-gray-400 mt-2">New User Registration</p>
                </div>

                {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm text-center">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input type="text" placeholder="Username" required className="cyber-input" value={username} onChange={(e) => setUsername(e.target.value)} />
                    </div>
                    <div>
                        <input type="email" placeholder="Email Address" required className="cyber-input" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div>
                        <input type="password" placeholder="Password" required className="cyber-input" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <div>
                        <input type="password" placeholder="Confirm Password" required className="cyber-input" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} />
                    </div>
                    <button disabled={loading} type="submit" className="cyber-button w-full mt-6">
                        {loading ? 'Registering...' : 'Create Account'}
                    </button>
                </form>

                <div className="text-center text-sm text-gray-400 mt-4">
                    Already registered? <Link to="/login" className="text-cyber-blue hover:text-cyber-cyan transition-colors ml-1">Login here</Link>
                </div>
            </div>
        </div>
    );
}
