import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthContext from '../context/AuthContext';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import Footer from '../components/Footer';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(formData.email, formData.password);
            toast.success("Welcome back! Audionix");
            navigate('/dashboard');
        } catch (err) {
            console.error("Login Error:", err);
            if (err.response?.data?.accountStatus === 'pending') {
                navigate('/pending-approval');
                return;
            }
            const errorMessage = err.response?.data?.message || err.message || 'Login failed';
            setError(errorMessage);
            toast.error(errorMessage);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-black">
            <div className="flex-1 flex items-center justify-center px-4 py-8">
                <div className="glass-panel w-full max-w-sm p-8 md:p-12 rounded-3xl animate-slideUp shadow-2xl">
                    <div className="text-center mb-6">
                        <div className="inline-block relative">
                            <h1 className="text-4xl font-black italic text-bold tracking-tighter text-red-500 leading-none">AUDIONIX</h1>
                            <span className="absolute -bottom-4 italic right-0 text-white tracking-tight text-[15px] font-normal ">Reseller</span>
                        </div>
                        <h2 className="text-zinc-400 font-medium text-lg mt-4">Welcome Back</h2>
                    </div>

                    {error && <div className="bg-red-900/10 text-red-500 p-3 rounded-xl mb-6 text-center text-sm font-medium border border-red-900/30">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4 relative group">
                            <FaEnvelope className="absolute top-1/2 -translate-y-1/2 right-4 text-zinc-400 group-focus-within:text-red-600 transition-colors" />
                            <input
                                type="email"
                                name="email"
                                placeholder="Email Address"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full pl-4 pr-12 py-4 bg-zinc-900 border border-zinc-800 rounded-xl focus:bg-zinc-900 focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all outline-none font-medium text-white placeholder-zinc-500"
                            />
                        </div>

                        <div className="mb-8 relative group">
                            <FaLock className="absolute top-1/2 -translate-y-1/2 right-4 text-zinc-400 group-focus-within:text-red-600 transition-colors" />
                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="w-full pl-4 pr-12 py-4 bg-zinc-900 border border-zinc-800 rounded-xl focus:bg-zinc-900 focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all outline-none font-medium text-white placeholder-zinc-500"
                            />
                        </div>
                        <div className="flex justify-end mb-6">
                            <button
                                type="button"
                                onClick={() => toast("Please contact Admin to receive a temporary password. WhatsApp us!", { icon: '🔑' })}
                                className="text-zinc-400 text-sm hover:text-white transition"
                            >
                                Forgot Password?
                            </button>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 rounded-lg bg-red-600 text-white font-semibold text-sm md:text-base hover:bg-red-700 transition duration-200"
                        >
                            Sign In
                        </button>
                    </form>
                    <p className="text-center mt-6 text-zinc-400 text-sm">
                        New here? <Link to="/register" className="text-red-500 hover:text-red-400 font-medium">Create Account</Link>
                    </p>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Login;
