import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { usePixel } from '../context/PixelContext';
import { FaUser, FaBuilding, FaEnvelope, FaLock, FaMapMarkerAlt, FaIdCard, FaPhone } from 'react-icons/fa';
import Footer from '../components/Footer';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobileNumber: '',
        password: '',
        businessName: '',
        gstNumber: '',
        address: ''
    });
    const [error, setError] = useState('');
    const { register } = useContext(AuthContext);
    const { trackEvent } = usePixel();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const data = await register(formData);
            trackEvent('CompleteRegistration', {
                status: 'success',
                content_name: 'reseller_registration'
            });

            if (data.accountStatus === 'pending') {
                navigate('/pending-approval');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };


    return (
        <div className="flex flex-col min-h-screen bg-black">
            <div className="flex-1 flex items-center justify-center px-4 py-8">
                <div className="glass-panel w-full max-w-lg p-8 md:p-12 rounded-3xl animate-slideUp shadow-2xl">
                    <div className="text-center mb-6">
                        <div className="inline-block relative">
                            <h1 className="text-4xl font-black italic tracking-tighter font-bold text-red-600 leading-none">AUDIONIX</h1>
                            <span className="absolute -bottom-4 italic right-0 text-white tracking-tight text-[15px] font-normal ">Reseller</span>
                        </div>
                        <h2 className="text-gradient text-xl font-bold mt-4">Join the Community</h2>
                    </div>
                    <p className="text-center text-zinc-400 mb-8 text-sm md:text-base">Start your reseller journey today</p>

                    {error && <div className="text-red-600 mb-4 text-center text-sm">{error}</div>}

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
                        <div className="relative group">
                            <FaUser className="absolute top-1/2 -translate-y-1/2  right-4  text-zinc-400 group-focus-within:text-red-600 transition-colors" />
                            <input type="text" name="name" placeholder="Full Name" onChange={handleChange} required
                                className="w-full pl-4 pr-12 py-4 bg-zinc-900 border border-zinc-800 rounded-xl focus:bg-zinc-900 focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all outline-none font-medium text-white placeholder-zinc-500" />
                        </div>

                        <div className="relative group">
                            <FaEnvelope className="absolute top-1/2 -translate-y-1/2 right-4 text-zinc-400 group-focus-within:text-red-600 transition-colors" />
                            <input type="email" name="email" placeholder="Email Address" onChange={handleChange} required
                                className="w-full pl-4 pr-12 py-4 bg-zinc-900 border border-zinc-800 rounded-xl focus:bg-zinc-900 focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all outline-none font-medium text-white placeholder-zinc-500" />
                        </div>

                        <div className="relative group">
                            <FaPhone className="absolute top-1/2 -translate-y-1/2 right-4 text-zinc-400 group-focus-within:text-red-600 transition-colors" />
                            <input type="tel" name="mobileNumber" placeholder="Mobile Number" onChange={handleChange} required
                                className="w-full pl-4 pr-12 py-4 bg-zinc-900 border border-zinc-800 rounded-xl focus:bg-zinc-900 focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all outline-none font-medium text-white placeholder-zinc-500" />
                        </div>

                        <div className="relative group">
                            <FaLock className="absolute top-1/2 -translate-y-1/2 right-4 text-zinc-400 group-focus-within:text-red-600 transition-colors" />
                            <input type="password" name="password" placeholder="Password" onChange={handleChange} required
                                className="w-full pl-4 pr-12 py-4 bg-zinc-900 border border-zinc-800 rounded-xl focus:bg-zinc-900 focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all outline-none font-medium text-white placeholder-zinc-500" />
                        </div>

                        <div className="relative group">
                            <FaBuilding className="absolute top-1/2 -translate-y-1/2 right-4 text-zinc-400 group-focus-within:text-red-600 transition-colors" />
                            <input type="text" name="businessName" placeholder="Business Name" onChange={handleChange} required
                                className="w-full pl-4 pr-12 py-4 bg-zinc-900 border border-zinc-800 rounded-xl focus:bg-zinc-900 focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all outline-none font-medium text-white placeholder-zinc-500" />
                        </div>

                        <div className="relative group">
                            <FaIdCard className="absolute top-1/2 -translate-y-1/2 right-4 text-zinc-400 group-focus-within:text-red-600 transition-colors" />
                            <input type="text" name="gstNumber" placeholder="GST Number (Optional)" onChange={handleChange}
                                className="w-full pl-4 pr-12 py-4 bg-zinc-900 border border-zinc-800 rounded-xl focus:bg-zinc-900 focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all outline-none font-medium text-white placeholder-zinc-500" />
                        </div>

                        <div className="relative group">
                            <FaMapMarkerAlt className="absolute top-4 right-4 text-zinc-400 group-focus-within:text-red-600 transition-colors" />
                            <textarea name="address" placeholder="Business Address" onChange={handleChange} required
                                className="w-full pl-4 pr-12 py-4 bg-zinc-900 border border-zinc-800 rounded-xl focus:bg-zinc-900 focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all outline-none font-medium text-white placeholder-zinc-500 min-h-[80px]" />
                        </div>

                        <div className="flex items-start gap-3 mt-2 px-1">
                            <input
                                type="checkbox"
                                id="policy-agreement"
                                required
                                className="mt-1.5 w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-red-600 focus:ring-red-600 cursor-pointer"
                            />
                            <label htmlFor="policy-agreement" className="text-zinc-400 text-sm cursor-pointer select-none">
                                By registering, you confirm that you have read, understood, and agreed to all <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="text-white font-bold hover:underline">Audionixresellers policies</Link>.
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-4 rounded-xl bg-red-600 text-white font-bold mt-4 hover:bg-red-700 transition duration-200 shadow-lg shadow-red-600/20"
                        >
                            Create Account
                        </button>
                    </form>

                    <p className="text-center mt-6 text-zinc-400 text-sm">
                        Already have an account? <Link to="/login" className="text-red-500 hover:text-red-400 font-medium">Sign In</Link>
                    </p>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Register;
