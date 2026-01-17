import React from 'react';
import { Link } from 'react-router-dom';
import { FaShieldAlt, FaExclamationTriangle, FaTable } from 'react-icons/fa';

const Privacy = () => {
    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
                <Link to="/" className="text-red-500 hover:text-red-400 mb-8 inline-block font-bold">&larr; Back to Home</Link>

                <h1 className="text-4xl md:text-5xl font-black mb-8">Privacy Policy</h1>

                <div className="space-y-12 text-zinc-400">

                    {/* Privacy Sections */}
                    <section className="space-y-6">
                        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
                            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><FaShieldAlt className="text-green-500" /> Information We Collect</h2>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Personal and business details</li>
                                <li>Login and account information</li>
                                <li>Transaction and order data</li>
                            </ul>
                        </div>

                        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
                            <h2 className="text-xl font-bold text-white mb-2">Use of Information</h2>
                            <p className="mb-2">Information is used to:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Operate and improve the platform</li>
                                <li>Process orders</li>
                                <li>Communicate updates</li>
                                <li>Fulfill legal and regulatory requirements</li>
                            </ul>
                        </div>

                        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
                            <h2 className="text-xl font-bold text-white mb-2">Data Protection</h2>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Data is stored securely</li>
                                <li>Shared only with logistics or service partners when required</li>
                                <li>No unauthorized sale of personal data</li>
                            </ul>
                        </div>

                        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
                            <h2 className="text-xl font-bold text-white mb-2">Cookies</h2>
                            <p>Cookies may be used to enhance platform experience and analytics.</p>
                        </div>

                        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
                            <h2 className="text-xl font-bold text-white mb-2">User Rights</h2>
                            <p>Users may request access, correction, or deletion of their data, subject to applicable laws.</p>
                        </div>
                    </section>

                    {/* Disclaimer */}
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <FaExclamationTriangle className="text-orange-500 text-xl" />
                            <h2 className="text-2xl font-bold text-white">Disclaimer</h2>
                        </div>
                        <div className="bg-zinc-900 p-8 rounded-3xl border-l-4 border-orange-500">
                            <p className="font-bold text-white mb-4">Audionixresellers:</p>
                            <ul className="list-disc pl-5 space-y-2 mb-6 text-zinc-300">
                                <li>Does not promise guaranteed income or profits</li>
                                <li>Does not sell directly to end customers</li>
                                <li>Does not provide product warranties unless explicitly stated</li>
                                <li>Is not responsible for reseller business outcomes</li>
                            </ul>
                            <p className="text-sm italic text-zinc-500">All business results depend on the reseller’s execution, pricing, and marketing strategy.</p>
                        </div>
                    </section>

                    {/* Free vs Premium Table */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <FaTable className="text-blue-500 text-xl" />
                            <h2 className="text-2xl font-bold text-white">Free vs Premium Plan – Policy Table</h2>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-zinc-800">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-zinc-900 text-white">
                                        <th className="p-4 font-bold border-b border-zinc-800">Feature</th>
                                        <th className="p-4 font-bold border-b border-zinc-800 border-l border-r border-zinc-800 w-1/3">Free Plan</th>
                                        <th className="p-4 font-bold border-b border-zinc-800 text-red-500 w-1/3">Premium Plan</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-zinc-800">
                                    {[
                                        { feat: "Registration Fee", free: "₹0", prem: "As per plan" },
                                        { feat: "Product Access", free: "All products", prem: "All products" },
                                        { feat: "MOQ", free: "No MOQ", prem: "No MOQ" },
                                        { feat: "Wholesale Margins", free: "Standard", prem: "Higher", highlight: true },
                                        { feat: "Customer Support", free: "Standard", prem: "Priority", highlight: true },
                                        { feat: "Shipping Priority", free: "Standard", prem: "Priority", highlight: true },
                                        { feat: "Business Services", free: "Limited", prem: "Advanced", highlight: true },
                                        { feat: "Best For", free: "Beginners", prem: "Growing & advanced resellers" },
                                    ].map((row, i) => (
                                        <tr key={i} className="hover:bg-zinc-900/50 transition bg-black">
                                            <td className="p-4 font-semibold text-zinc-300">{row.feat}</td>
                                            <td className="p-4 border-l border-r border-zinc-800 text-zinc-400">{row.free}</td>
                                            <td className={`p-4 font-medium ${row.highlight ? 'text-white' : 'text-zinc-400'}`}>{row.prem}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
};

export default Privacy;
