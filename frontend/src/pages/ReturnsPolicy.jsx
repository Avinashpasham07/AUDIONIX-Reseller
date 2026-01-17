import React from 'react';
import { Link } from 'react-router-dom';
import { FaVideo, FaTimesCircle, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

const ReturnsPolicy = () => {
    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
                <Link to="/" className="text-red-500 hover:text-red-400 mb-8 inline-block font-bold">&larr; Back to Home</Link>

                <h1 className="text-4xl md:text-5xl font-black mb-4">Returns & Refund Policy</h1>
                <p className="text-xl text-zinc-400 mb-12 border-l-4 border-red-600 pl-4">
                    We follow a strict but fair return policy to protect both resellers and suppliers.
                </p>

                <div className="space-y-12">
                    {/* Returns Accepted */}
                    <section className="bg-zinc-900/50 p-8 rounded-3xl border border-green-900/30">
                        <div className="flex items-center gap-3 mb-6">
                            <FaCheckCircle className="text-green-500 text-2xl" />
                            <h2 className="text-2xl font-bold text-white">Returns Are Accepted Only If</h2>
                        </div>
                        <ul className="space-y-4 text-zinc-300">
                            <li className="flex gap-3 items-start">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2.5 shrink-0" />
                                <span>Product is damaged or defective at the time of delivery.</span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2.5 shrink-0" />
                                <span>A <strong>clear unboxing video</strong> is provided.</span>
                            </li>
                        </ul>

                        <div className="mt-6 bg-black p-6 rounded-xl border border-zinc-800">
                            <div className="flex items-center gap-2 mb-3 text-red-500 font-bold">
                                <FaVideo /> Video Requirements:
                            </div>
                            <ul className="space-y-2 text-zinc-400 text-sm ml-1">
                                <li className="flex gap-2 items-center">
                                    <span className="w-1 h-1 bg-zinc-500 rounded-full" /> Continuous (no cuts or edits)
                                </li>
                                <li className="flex gap-2 items-center">
                                    <span className="w-1 h-1 bg-zinc-500 rounded-full" /> Recorded before opening the package
                                </li>
                                <li className="flex gap-2 items-center">
                                    <span className="w-1 h-1 bg-zinc-500 rounded-full" /> Showing the shipping label clearly
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* Returns NOT Accepted */}
                    <section className="bg-zinc-900/50 p-8 rounded-3xl border border-red-900/30">
                        <div className="flex items-center gap-3 mb-6">
                            <FaTimesCircle className="text-red-500 text-2xl" />
                            <h2 className="text-2xl font-bold text-white">Returns Are NOT Accepted If</h2>
                        </div>
                        <ul className="space-y-4 text-zinc-300">
                            {[
                                "No unboxing video is provided",
                                "Damage occurred after delivery",
                                "Customer dissatisfaction due to expectations",
                                "Change of mind or wrong selling claims",
                                "False warranty or marketing promises by reseller"
                            ].map((item, i) => (
                                <li key={i} className="flex gap-3 items-start">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2.5 shrink-0" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* Warranty Disclaimer */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <FaExclamationTriangle className="text-orange-500 text-xl" />
                            <h2 className="text-2xl font-bold text-white">Warranty Disclaimer</h2>
                        </div>
                        <div className="bg-zinc-900 p-6 rounded-2xl border-l-4 border-orange-500">
                            <ul className="space-y-3 text-zinc-400">
                                <li className="flex gap-2 items-start">
                                    • Audionix Resellers does not provide warranty.
                                </li>
                                <li className="flex gap-2 items-start">
                                    • Resellers must sell products based on actual margins.
                                </li>
                                <li className="flex gap-2 items-start">
                                    • No fake guarantees or misleading claims allowed.
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* Refund / Replacement */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">Refund / Replacement</h2>
                        <ul className="space-y-3 text-zinc-400">
                            <li className="flex gap-2 items-start">
                                <span className="text-green-500">✓</span> Approved claims will be processed after verification.
                            </li>
                            <li className="flex gap-2 items-start">
                                <span className="text-green-500">✓</span> Resolution timeline will be communicated per case.
                            </li>
                        </ul>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default ReturnsPolicy;
