import React from 'react';
import { Link } from 'react-router-dom';

const Terms = () => {
    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
                <Link to="/" className="text-red-500 hover:text-red-400 mb-8 inline-block font-bold">&larr; Back to Home</Link>
                <h1 className="text-4xl md:text-5xl font-black mb-2">Terms & Conditions</h1>
                <p className="text-zinc-500 mb-12">Last updated: {new Date().toLocaleDateString()}</p>

                <div className="space-y-12 text-zinc-400">

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">1. Introduction & Acceptance of Terms</h2>
                        <p>These Terms & Conditions (“Terms”) govern the use of the Audionixresellers platform, services, website, and related offerings operated by Audionixresellers (“Audionixresellers”, “we”, “our”, “us”).</p>
                        <p className="mt-2">By accessing, registering, or using Audionixresellers, you (“Reseller”, “User”, “you”) agree to be legally bound by these Terms, along with our Privacy Policy, Disclaimer, Return Policy, and any additional policies published from time to time.</p>
                        <p className="mt-2 text-red-500 font-semibold">If you do not agree with these Terms, you must not use the platform.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">2. Nature of Platform (Important Declaration)</h2>
                        <p>Audionixresellers is a B2B wholesale supply and business enablement platform.</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Audionixresellers does not sell directly to end customers</li>
                            <li>Audionixresellers is not a consumer marketplace</li>
                            <li>Audionixresellers does not act as an agent, broker, or intermediary between the reseller and the end customer</li>
                            <li>Each reseller operates their business independently</li>
                        </ul>
                        <p className="mt-2">Audionixresellers’ role is limited to product supply, dispatch (where applicable), and optional support services.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">3. Eligibility</h2>
                        <p>To use Audionixresellers, you must:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Be at least 18 years of age</li>
                            <li>Be legally capable of entering a binding contract under Indian law</li>
                            <li>Provide true, accurate, and complete registration information</li>
                        </ul>
                        <p className="mt-2">Audionixresellers reserves the right to approve, reject, suspend, or terminate any account at its sole discretion.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">4. Plans & Platform Access</h2>
                        <div className="ml-4 border-l-2 border-zinc-800 pl-4 py-2">
                            <h3 className="font-bold text-zinc-200">4.1 Free Plan</h3>
                            <ul className="list-disc pl-5 mt-1 mb-4 space-y-1 text-sm">
                                <li>No registration or joining fee</li>
                                <li>Access to all listed products</li>
                                <li>Standard wholesale margins</li>
                                <li>Standard support and shipping options</li>
                            </ul>

                            <h3 className="font-bold text-zinc-200">4.2 Premium Plan</h3>
                            <p className="text-sm">Premium plans are optional and provide:</p>
                            <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
                                <li>Higher wholesale margins</li>
                                <li>Priority customer support</li>
                                <li>Priority and faster shipping options</li>
                                <li>Advanced business and operational services</li>
                            </ul>
                        </div>
                        <p className="mt-2 text-sm italic">Plan features, pricing, and eligibility may be modified as per Audionixresellers’ policies.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">5. Orders & Payments</h2>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>All orders must be paid in full before dispatch</li>
                            <li>All prices displayed are wholesale prices</li>
                            <li>No credit facility is provided</li>
                            <li>Audionixresellers may cancel orders due to non-payment, pricing errors, or policy violations</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">6. Shipping & Fulfillment</h2>
                        <p>Resellers may choose from the following options:</p>
                        <div className="mt-2 space-y-2">
                            <p><strong className="text-zinc-300">a) Reseller-Managed Shipping:</strong> Product is shipped to the reseller. Reseller handles delivery to the end customer.</p>
                            <p><strong className="text-zinc-300">b) Audionixresellers-Managed Shipping:</strong> Product shipped directly to the end customer. Neutral packaging used.</p>
                        </div>
                        <p className="mt-2 text-sm">Audionixresellers is not responsible for delays caused by third-party logistics partners after dispatch.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">7. Cash on Delivery (COD)</h2>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>COD is permitted only if the reseller pays the full product amount in advance</li>
                            <li>COD collection, rejection, delays, and losses are the sole responsibility of the reseller</li>
                            <li>Audionixresellers does not provide COD services or bear COD-related risks</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">8. Pricing, Margins & Profits</h2>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Audionixresellers does not charge commission on sales</li>
                            <li>Resellers are free to determine their own selling prices</li>
                            <li>Profits are earned directly by the reseller</li>
                            <li>Audionixresellers does not guarantee profits, margins, or sales volume</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">9. Returns, Refunds & Replacements</h2>
                        <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                            <p className="font-semibold text-white mb-2">Returns are accepted only when:</p>
                            <ul className="list-disc pl-5 mb-4 space-y-1">
                                <li>The product is damaged or defective at the time of delivery</li>
                                <li>A continuous, unedited unboxing video is submitted</li>
                                <li>Claims are raised within the stipulated timeline</li>
                            </ul>

                            <p className="font-semibold text-white mb-2">Returns are not accepted for:</p>
                            <ul className="list-disc pl-5 mb-2 space-y-1 text-red-400">
                                <li>Customer dissatisfaction or change of mind</li>
                                <li>False warranty or marketing claims by reseller</li>
                                <li>Damage occurring after delivery</li>
                            </ul>
                            <p className="mt-2 text-sm">No warranty is provided unless explicitly stated.</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">10. Reseller Responsibilities</h2>
                        <p>Resellers are solely responsible for:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>End-customer communication</li>
                            <li>Pricing, promotions, and marketing claims</li>
                            <li>Legal compliance and applicable taxes (including GST)</li>
                            <li>COD handling and reconciliation</li>
                        </ul>
                        <p className="mt-2 text-sm">Audionixresellers shall not be liable for reseller-side business operations.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">11. Prohibited Activities</h2>
                        <p>Resellers must not:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1 text-red-400">
                            <li>Make false warranty or guarantee claims</li>
                            <li>Misrepresent Audionixresellers as the end seller</li>
                            <li>Abuse return policies</li>
                            <li>Engage in fraudulent or illegal activities</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">12. Account Suspension & Termination</h2>
                        <p>Audionixresellers reserves the right to suspend or terminate accounts for:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Policy violations</li>
                            <li>Payment defaults</li>
                            <li>Fraud or misrepresentation</li>
                            <li>Actions harmful to suppliers, customers, or the platform</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">13. Limitation of Liability</h2>
                        <p>Audionixresellers shall not be liable for:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Loss of profits or revenue</li>
                            <li>Business interruption</li>
                            <li>Customer disputes</li>
                            <li>COD losses</li>
                            <li>Courier delays</li>
                            <li>Indirect or consequential damages</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">14. Governing Law & Jurisdiction</h2>
                        <p>These Terms shall be governed by the laws of India.</p>
                        <p>Courts of New Delhi shall have exclusive jurisdiction.</p>
                    </section>

                </div>
            </div>
        </div>
    );
};

export default Terms;
