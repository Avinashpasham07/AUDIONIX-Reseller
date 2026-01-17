import React from 'react';
import { Link } from 'react-router-dom';
import { FaCheckCircle, FaClock, FaWhatsapp } from 'react-icons/fa';

const PendingApproval = () => {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-red-600/20 blur-3xl rounded-full pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-zinc-800 rounded-full mb-6">
                        <FaCheckCircle className="text-4xl text-green-500" />
                    </div>

                    <h1 className="text-2xl font-black text-white mb-2">Thank You for Registering!</h1>
                    <p className="text-zinc-400 mb-8 leading-relaxed">
                        We have received your request.
                        <br /><br />
                        <span className="text-white font-bold">We will approve your request by verifying your business.</span>
                    </p>

                    <div className="bg-zinc-800/50 rounded-xl p-4 mb-8 border border-zinc-800 text-left">
                        <h4 className="text-zinc-300 font-bold text-sm mb-2 flex items-center gap-2">
                            <FaClock className="text-amber-500" /> What happens next?
                        </h4>
                        <ul className="text-sm text-zinc-500 space-y-2 pl-6 list-disc">
                            <li>Our team typically verifies details within 12 hours.</li>
                            <li>This process usually takes 12 hours.</li>
                            <li>check by login in 12 hours.</li>
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <a
                            href="https://wa.me/919876543210?text=Hi,%20I%20just%20registered%20on%20Audionix.%20Please%20approve%20my%20account."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full block py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition flex items-center justify-center gap-2"
                        >
                            <FaWhatsapp size={18} /> Fast Track Approval
                        </a>
                        <Link to="/login" className="block py-3 rounded-xl border border-zinc-700 text-zinc-300 font-bold hover:bg-zinc-800 transition">
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PendingApproval;
