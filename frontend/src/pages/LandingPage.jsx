
import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    FaBolt, FaShieldAlt, FaChartLine, FaBoxOpen, FaUserPlus, FaArrowRight, FaIdCard,
    FaCheckCircle, FaUsers, FaGlobeAsia, FaHandshake, FaLaptopCode, FaShippingFast,
    FaBullhorn, FaMoneyBillWave, FaSearchDollar, FaPlus, FaMinus, FaHeadset,
    FaBars, FaTimes
} from 'react-icons/fa';
import AuthContext from '../context/AuthContext';
import Footer from '../components/Footer';
import MeetingRequestModal from '../components/MeetingRequestModal';
import toast from 'react-hot-toast';
import Reveal from '../components/Reveal';

const Counter = ({ end, duration = 2000 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime;
        let animationFrame;

        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = currentTime - startTime;

            if (progress < duration) {
                setCount(Math.min(end, Math.floor((progress / duration) * end)));
                animationFrame = requestAnimationFrame(animate);
            } else {
                setCount(end);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrame);
    }, [end, duration]);

    return <span>{count.toLocaleString()}</span>;
};

import SEO from '../components/SEO';

// ... (previous imports and Counter component)

const LandingPage = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState(null);
    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Handle scroll effect for navbar
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleScheduleClick = (e) => {
        e.preventDefault();
        setShowMeetingModal(true);
        setMobileMenuOpen(false);
    };

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Audionix Reseller",
        "url": "https://audionix-reseller.com",
        "logo": "https://audionix-reseller.com/assets/logo.png",
        "sameAs": [
            "https://www.instagram.com/audionix.resellers",
            "https://chat.whatsapp.com/EICnjNAugtsHnSYwlOeIoo"
        ],
        "description": "Start your own reseller business with zero inventory and zero investment. Audionix connects you with wholesale suppliers."
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-red-900 selection:text-white overflow-x-hidden">
            <SEO
                title="Best Reselling App in India - Zero Investment Business"
                description="Join Audionix Resellers to start your online business without inventory. Get wholesale prices, single-piece shipping, and high profit margins. Verified suppliers."
                keywords="Audionix, Reseller App, Work from Home, Wholesale Business, Zero Investment, Dropshipping India, Audionix Reseller"
            />
            <script type="application/ld+json">
                {JSON.stringify(structuredData)}
            </script>

            {/* Navbar */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-black/90 backdrop-blur-xl border-b border-zinc-800 shadow-lg py-3' : 'bg-transparent py-5'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-2 z-50">
                        <Link to="/" className="inline-block relative group" onClick={() => setMobileMenuOpen(false)}>
                            <div className="text-2xl md:text-3xl font-black italic text-bold tracking-tighter text-red-600 leading-none transition-transform group-hover:scale-105">AUDIONIX</div>
                            <span className="absolute -bottom-3 md:-bottom-4 italic right-0 text-white tracking-tight text-[12px] md:text-[15px] font-normal opacity-80">Reseller</span>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-6">
                        {!user && (
                            <Link to="/login" className="text-zinc-400 font-bold text-sm hover:text-white transition-colors relative after:content-[''] after:absolute after:w-0 after:h-0.5 after:bg-red-600 after:left-0 after:-bottom-1 after:transition-all hover:after:w-full">
                                Login
                            </Link>
                        )}
                        {user ? (
                            <Link to="/dashboard" className="bg-white text-black px-6 py-2.5 rounded-full font-bold text-sm hover:bg-zinc-200 transition-all shadow-lg shadow-white/10 hover:shadow-white/20 active:scale-95 transform hover:-translate-y-0.5">
                                Go to Dashboard
                            </Link>
                        ) : (
                            <Link to="/register" className="bg-red-600 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 hover:shadow-red-600/40 active:scale-95 flex items-center gap-2 group transform hover:-translate-y-0.5">
                                Apply Now <FaArrowRight className="group-hover:translate-x-1 transition-transform" size={12} />
                            </Link>
                        )}
                    </div>

                    {/* Mobile Toggle */}
                    <button
                        className="md:hidden z-50 w-11 h-11 flex items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-white active:scale-90 transition-all hover:bg-zinc-800 shadow-lg shadow-black/50"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <FaTimes size={22} className="text-red-500" /> : <FaBars size={22} />}
                    </button>

                    {/* Mobile Menu Dropdown */}
                    <div className={`absolute top-full left-0 w-full bg-zinc-950 border-b border-zinc-800 shadow-2xl transition-all duration-300 ease-in-out md:hidden flex flex-col overflow-hidden ${mobileMenuOpen ? 'max-h-[400px] opacity-100 py-6' : 'max-h-0 opacity-0 py-0'}`}>
                        <div className="flex flex-col gap-4 px-6">
                            {user ? (
                                <Link
                                    to="/dashboard"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="w-full bg-white text-black py-3 rounded-xl font-bold text-center shadow-lg active:scale-[0.98] transition-transform"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="w-full bg-zinc-900 border border-zinc-800 text-white py-3 rounded-xl font-bold text-center active:scale-[0.98] transition-all hover:bg-zinc-800"
                                    >
                                        Log In
                                    </Link>
                                    <Link
                                        to="/register"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="w-full bg-red-600 text-white py-3 rounded-xl font-bold text-center shadow-lg shadow-red-900/20 active:scale-[0.98] transition-all"
                                    >
                                        Apply Now
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="pt-32 bg-black pb-20 md:pt-48 md:pb-32 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-red-600/10 to-transparent -z-10 rounded-l-[100px] opacity-70" />
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8 animate-slideUp">
                        <Reveal delay={0.1}>
                            <div className="inline-flex items-center gap-2 bg-red-900/10 text-red-500 px-4 py-1.5 rounded-full text-xs font-bold border border-red-900/30">
                                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                                Start Your Business Without Inventory
                            </div>
                        </Reveal>
                        <Reveal delay={0.2}>
                            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] text-white">
                                Zero Inventory. <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                                    Zero Investment.
                                </span>
                            </h1>
                        </Reveal>
                        <Reveal delay={0.3}>
                            <p className="text-xl text-zinc-400 leading-relaxed max-w-lg">
                                Audionix Resellers helps small business owners sell products at real wholesale prices, even in single quantities. No middlemen. No fake promises.
                            </p>
                        </Reveal>
                        <Reveal delay={0.4}>
                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <Link to="/register" className="bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-zinc-200 transition shadow-xl shadow-white/10 flex items-center justify-center gap-2">
                                    Apply as a Reseller <FaArrowRight size={14} />
                                </Link>
                                <button onClick={handleScheduleClick} className="bg-zinc-900 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-zinc-800 transition border border-zinc-700 flex items-center justify-center gap-2 group">
                                    <FaHeadset className="group-hover:text-green-500 transition-colors" /> Schedule Call
                                </button>
                            </div>
                        </Reveal>
                        <Reveal delay={0.5}>
                            <div className="flex flex-col md:flex-row flex-wrap gap-4 pt-6 w-full">
                                {/* Verified Suppliers */}
                                <div className="flex items-center justify-center gap-3 px-5 py-3 bg-green-900/10 border border-green-900 rounded-2xl transition-all duration-300 shadow-lg shadow-green-900/20 cursor-default w-full md:w-auto">
                                    <div className="p-2 bg-green-500/20 text-green-400 rounded-full transition-colors">
                                        <FaShieldAlt className="text-sm" />
                                    </div>
                                    <span className="font-bold text-white text-sm">Verified Suppliers</span>
                                </div>

                                {/* Active Resellers */}
                                <div className="flex items-center justify-center gap-3 px-5 py-3 bg-orange-900/10 border border-orange-900 rounded-2xl transition-all duration-300 shadow-lg shadow-orange-900/20 cursor-default w-full md:w-auto">
                                    <div className="p-2 bg-orange-500/20 text-orange-400 rounded-full transition-colors">
                                        <FaUserPlus className="text-sm" />
                                    </div>
                                    <span className="font-bold text-white text-sm flex items-center gap-1">
                                        <span className="text-3xl text-orange-400 font-black"><Counter end={150} />+</span> Suppliers
                                    </span>
                                </div>

                                {/* No MOQ */}
                                <div className="flex items-center justify-center gap-3 px-5 py-3 bg-blue-900/10 border border-blue-900 rounded-2xl transition-all duration-300 shadow-lg shadow-blue-900/20 cursor-default w-full md:w-auto">
                                    <div className="p-2 bg-blue-500/20 text-blue-400 rounded-full transition-colors">
                                        <FaBoxOpen className="text-sm" />
                                    </div>
                                    <span className="font-bold text-white text-sm">No MOQ</span>
                                </div>
                            </div>
                        </Reveal>
                    </div>
                    <div className="relative hidden md:block">
                        <Reveal delay={0.4}>
                            {/* CSS Mobile Mockup */}
                            <div className="relative z-10 mx-auto w-[320px] bg-zinc-900 rounded-[3rem] p-3 shadow-2xl rotate-[0deg] hover:rotate-[-6deg] transition-all duration-700 ease-out border-[6px] border-zinc-700 ring-1 ring-zinc-600/50 hover:shadow-red-900/20">
                                {/* Screen Container */}
                                <div className="bg-gray-50 rounded-[2.25rem] overflow-hidden h-[640px] relative flex flex-col">
                                    {/* Dynamic Island / Status Bar */}
                                    <div className="absolute top-0 w-full h-12 z-20 flex justify-center items-start pt-3">
                                        <div className="w-28 h-7 bg-black rounded-full flex items-center justify-end px-3 gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                        </div>
                                    </div>

                                    {/* App Header */}
                                    <div className="pt-14 pb-6 px-6 bg-white border-b border-gray-100 flex justify-between items-center shadow-sm">
                                        <div>
                                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Welcome Back</div>
                                            <div className="text-xl font-black text-gray-900">Reseller HQ</div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-white shadow-sm overflow-hidden">
                                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Reseller" alt="User" />
                                        </div>
                                    </div>

                                    {/* Scrollable Content */}
                                    <div className="p-5 space-y-5 overflow-hidden relative">
                                        {/* Main Card - Earnings */}
                                        <div className="p-6 rounded-3xl bg-zinc-50 text-black shadow-lg shadow-gray-200 relative overflow-hidden group border border-gray-100">
                                            <div className="absolute top-0 right-0 p-3 opacity-10">
                                                <FaChartLine size={80} className="text-white" />
                                            </div>
                                            <div className="relative z-10">
                                                <p className="text-gray-400 text-sm font-medium mb-1">Total Earnings</p>
                                                <h3 className="text-4xl font-black tracking-tight mb-4">₹24,000</h3>
                                                <div className="flex gap-2">
                                                    <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                                        +12.5% <span className="text-[10px]">▲</span>
                                                    </span>
                                                    <span className="text-xs text-gray-400 py-1">vs last week</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stat Grid */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                                <div className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center mb-3">
                                                    <FaBoxOpen size={14} />
                                                </div>
                                                <div className="text-2xl font-bold text-gray-900">12</div>
                                                <div className="text-xs text-gray-500 font-medium">To Dispatch</div>
                                            </div>
                                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center mb-3">
                                                    <FaBolt size={14} />
                                                </div>
                                                <div className="text-2xl font-bold text-gray-900">5</div>
                                                <div className="text-xs text-gray-500 font-medium">In Transit</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Reveal>
                    </div>
                </div>
            </header>

            {/* What We Do / Core Offering */}
            <section className="py-24 px-6 bg-zinc-900">
                <div className="max-w-7xl mx-auto">
                    <Reveal>
                        <div className="text-center mb-16">
                            <span className="text-red-500 font-bold tracking-widest uppercase text-sm">Our Core Offering</span>
                            <h2 className="text-3xl md:text-5xl font-black text-white mt-2 mb-4">What We Do</h2>
                            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                                Audionix Resellers connects you with verified Indian manufacturers and direct import products from China, allowing you to sell confidently without holding stock.
                            </p>
                        </div>
                    </Reveal>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { icon: <FaBoxOpen />, text: "Single-piece products at wholesale prices" },
                            { icon: <FaCheckCircle />, text: "No Minimum Order Quantity (MOQ)" },
                            { icon: <FaShieldAlt />, text: "No inventory or warehousing required" },
                            { icon: <FaShippingFast />, text: "Pan-India delivery support" },
                            { icon: <FaGlobeAsia />, text: "Ship from your end or ship directly from us" },
                            { icon: <FaMoneyBillWave />, text: "Transparent pricing & detailed processes" }
                        ].map((item, i) => (
                            <Reveal key={i} delay={i * 0.1} className="h-full">
                                <div className="bg-black/50 p-6 rounded-2xl border border-red-500/50 md:border-zinc-800 shadow-xl shadow-red-600/20 md:shadow-red-900/5 hover:shadow-red-600/20 hover:border-red-500/50 transition-all duration-300 flex items-center gap-4 h-full">
                                    <div className="w-12 h-12 rounded-full bg-red-900/20 text-red-500 flex items-center justify-center text-xl shrink-0">
                                        {item.icon}
                                    </div>
                                    <h3 className="font-bold text-lg text-zinc-200">{item.text}</h3>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works - Step by Step */}
            <section className="py-24 px-6 bg-black relative">
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/20 to-black pointer-events-none" />
                <div className="max-w-7xl mx-auto relative z-10">
                    <Reveal>
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">How It Works</h2>
                            <p className="text-xl text-zinc-400">Six simple steps to start your profitable journey.</p>
                        </div>
                    </Reveal>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { step: "01", title: "Apply & Get Approved", desc: "Register as a reseller. Once verified, your account is approved for access to wholesale pricing." },
                            { step: "02", title: "Browse & Select Products", desc: "Choose from trending, daily-use, and all-category products listed after quality verification." },
                            { step: "03", title: "Receive Customer Orders", desc: "Sell online or offline at your own price and margins." },
                            { step: "04", title: "Make Payment to Audionix", desc: "You pay only the product cost before dispatch." },
                            { step: "05", title: "Shipping Options", desc: "Ship from your end using your own label OR let Audionix ship directly to your customer." },
                            { step: "06", title: "You Keep the Margin", desc: "No commission. No hidden charges. You keep 100% of your profit." }
                        ].map((item, i) => (
                            <Reveal key={i} delay={i * 0.1} className="h-full">
                                <div className="group relative bg-zinc-900 p-8 rounded-3xl border border-red-500/30 md:border-zinc-800 shadow-2xl shadow-red-600/20 md:shadow-black/50 hover:shadow-red-600/20 hover:border-red-500/30 transition-all duration-300 h-full">
                                    <div className="text-5xl font-black text-red-900 md:text-zinc-800 mb-6 group-hover:text-red-900 transition-colors">{item.step}</div>
                                    <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                                    <p className="text-zinc-400 leading-relaxed">{item.desc}</p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Choose Audionix */}
            <section className="py-24 px-6 bg-zinc-900">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row gap-16 items-center">
                        <div className="flex-1">
                            <Reveal>
                                <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Why Choose <br /> Audionix Resellers?</h2>
                                <p className="text-xl text-zinc-400 mb-8">We are built for serious sellers, not gimmick-based platforms.</p>
                            </Reveal>

                            <div className="space-y-4">
                                {[
                                    "Verified suppliers across India & China imports",
                                    "Products tested before listing",
                                    "No MOQ, even single-piece orders",
                                    "No middlemen like IndiaMart",
                                    "Transparent pricing & processes",
                                    "150+ active resellers onboarded"
                                ].map((feat, i) => (
                                    <Reveal key={i} delay={i * 0.1}>
                                        <div className="flex items-center gap-4 bg-black p-4 rounded-xl border border-zinc-500 md:border-zinc-700 shadow-lg shadow-red-600/10 md:shadow-black/50 hover:shadow-red-600/10 hover:border-zinc-500 transition-all duration-300">
                                            <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-xs">✓</div>
                                            <span className="font-bold text-zinc-200">{feat}</span>
                                        </div>
                                    </Reveal>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 relative">
                            <Reveal delay={0.4}>
                                <img
                                    src="/assets/india_network_map.png"
                                    alt="India Seller Network Map"
                                    className="relative z-10 w-full h-auto rounded-3xl border border-zinc-700 shadow-2xl shadow-black/50 "
                                />
                                <div className="absolute -inset-4 bg-gradient-to-r from-red-600 to-orange-600 blur-3xl opacity-20 -z-10 rounded-full" />
                            </Reveal>
                        </div>
                    </div>
                </div>


                {/* Comparison Table */}
                <div className="max-w-5xl mx-auto mt-20">
                    <Reveal>
                        <h3 className="text-2xl md:text-3xl font-black text-center text-white mb-10">Audionix vs. The Market</h3>
                    </Reveal>
                    <Reveal delay={0.2}>
                        <div className="overflow-x-auto shadow-2xl shadow-black/50 rounded-xl border border-zinc-800">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr>
                                        <th className="p-6 bg-zinc-900 border-b-2 border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider w-1/3">Feature</th>
                                        <th className="p-6 bg-red-900/10 border-b-2 border-red-600 text-red-500 font-black text-xl uppercase tracking-wider w-1/3 text-center">Audionix</th>
                                        <th className="p-6 bg-zinc-900 border-b-2 border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider w-1/3 text-center">Others</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {[
                                        { feature: "Registration Fee", us: "FREE", them: "Often Charged (₹999+)" },
                                        { feature: "Minimum Order (MOQ)", us: "1 Unit (Single Piece)", them: "Bulk Only (10-50 units)" },
                                        { feature: "Inventory", us: "Zero Inventory", them: "Warehousing Required" },
                                        { feature: "Profit Margins", us: "High (Direct Wholesale)", them: "Low (Multiple Middlemen)" },
                                        { feature: "Shipping Support", us: "Direct to Customer", them: "Self-Ship Only" },
                                        { feature: "Payouts", us: "Instant", them: "Weekly/Monthly" }
                                    ].map((row, i) => (
                                        <tr key={i} className="hover:bg-white/5 transition-colors">
                                            <td className="p-6 font-bold text-zinc-300">{row.feature}</td>
                                            <td className="p-6 text-center font-bold text-white bg-red-900/5">{row.us}</td>
                                            <td className="p-6 text-center text-zinc-500">{row.them}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Reveal>
                </div>
            </section >

            {/* About Us / Mission / Values */}
            < section className="py-24 px-6 bg-black" >
                <div className="max-w-4xl mx-auto text-center">
                    <Reveal>
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-8">Who We Are?</h2>
                        <p className="text-lg text-zinc-400 leading-relaxed mb-12">
                            Audionix Resellers is an extension of Audionix, created to empower small business owners, online sellers, and offline retailers with access to trusted wholesale supply chains.
                            We saw a major gap in the market: Fake suppliers, unreal profit promises, MOQ pressure, poor quality products, and zero accountability.
                            <br /><br />
                            <span className="text-white font-bold">So we built a system that is transparent, realistic, and sustainable.</span>
                        </p>
                    </Reveal>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                        <Reveal delay={0.2}>
                            <div className="bg-zinc-900 p-8 rounded-3xl border border-red-900 md:border-zinc-800 shadow-xl shadow-red-600/10 md:shadow-black/50 hover:shadow-red-600/10 hover:border-red-600 transition-all duration-300 h-full">
                                <h3 className="text-2xl font-bold text-white mb-4">Our Mission</h3>
                                <p className="text-zinc-400">To help individuals and small businesses start and scale without holding inventory, risking large capital, or falling for reseller frauds. We believe real businesses are built with clarity, not hype.</p>
                            </div>
                        </Reveal>
                        <Reveal delay={0.3}>
                            <div className="bg-zinc-900 p-8 rounded-3xl border border-red-900 md:border-zinc-800 shadow-xl shadow-red-600/10 md:shadow-black/50 hover:shadow-red-600/10 hover:border-red-600 transition-all duration-300 h-full">
                                <h3 className="text-2xl font-bold text-white mb-4">Our Values</h3>
                                <ul className="space-y-2 text-zinc-400">
                                    <li className="flex gap-2 items-center"><span className="w-2 h-2 bg-red-500 rounded-full" /> Transparency over gimmicks</li>
                                    <li className="flex gap-2 items-center"><span className="w-2 h-2 bg-red-500 rounded-full" /> Quality over quantity</li>
                                    <li className="flex gap-2 items-center"><span className="w-2 h-2 bg-red-500 rounded-full" /> Long-term partnerships</li>
                                    <li className="flex gap-2 items-center"><span className="w-2 h-2 bg-red-500 rounded-full" /> Honest margins</li>
                                </ul>
                            </div>
                        </Reveal>
                    </div>
                </div>
            </section >

            {/* Who Can Use This */}
            < section className="py-24 px-6 bg-zinc-900" >
                <div className="max-w-7xl mx-auto">
                    <Reveal>
                        <h2 className="text-3xl md:text-5xl font-black text-center text-white mb-16">Who Can Use Audionix?</h2>
                    </Reveal>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {[
                            { icon: <FaGlobeAsia />, title: "Online Sellers", sub: "Instagram, WhatsApp, Web" },
                            { icon: <FaBoxOpen />, title: "Shop Owners", sub: "Offline Retailers" },
                            { icon: <FaUserPlus />, title: "Entrepreneurs", sub: "Starting from Scratch" },
                            { icon: <FaShippingFast />, title: "Dropshippers", sub: "Zero Inventory Model" },
                            { icon: <FaHandshake />, title: "Distributors", sub: "Small Agents" },
                        ].map((persona, i) => (
                            <Reveal key={i} delay={i * 0.1} className="h-full">
                                <div className="bg-zinc-800 md:bg-black p-6 rounded-2xl border border-zinc-700 md:border-zinc-800 text-center hover:bg-zinc-800 transition-all duration-300 shadow-lg shadow-red-600/20 md:shadow-red-900/5 hover:shadow-2xl hover:shadow-red-600/20 hover:border-zinc-700 relative -top-1 md:top-0 hover:-top-1 h-full">
                                    <div className="text-3xl text-red-500 mb-4 flex justify-center">{persona.icon}</div>
                                    <h3 className="font-bold text-white mb-1">{persona.title}</h3>
                                    <p className="text-xs text-zinc-500">{persona.sub}</p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                    <Reveal delay={0.5}>
                        <p className="text-center text-zinc-500 mt-8">No prior experience required.</p>
                    </Reveal>
                </div>
            </section >

            {/* Additional Services */}
            < section className="py-24 px-6 bg-black" >
                <div className="max-w-7xl mx-auto">
                    <Reveal>
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">We Do More Than Supply</h2>
                            <p className="text-xl text-zinc-400">Comprehensive services to help you build a brand, not just a resell business.</p>
                        </div>
                    </Reveal>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                icon: <FaLaptopCode />,
                                title: "Website Development",
                                features: ["Custom Reseller Websites", "E-commerce Setup", "Payment Gateway"]
                            },
                            {
                                icon: <FaSearchDollar />,
                                title: "Product Research",
                                features: ["Trending Products", "Margin-based Selection", "Demand Analysis"]
                            },
                            {
                                icon: <FaShippingFast />,
                                title: "Shipping & COD",
                                features: ["Courier Partner Setup", "COD Enablement", "Automation Guidance"]
                            },
                            {
                                icon: <FaBullhorn />,
                                title: "Digital Marketing",
                                features: ["Instagram & Meta Ads", "Google Ads", "Sales Funnel Planning"]
                            }
                        ].map((service, i) => (
                            <Reveal key={i} delay={i * 0.1} className="h-full">
                                <div className="bg-gradient-to-b from-zinc-900 to-black p-8 rounded-3xl border border-red-500/50 md:border-zinc-800 hover:border-red-500/50 transition-all duration-300 shadow-2xl shadow-red-600/20 md:shadow-black/50 hover:shadow-red-600/20 h-full">
                                    <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center text-3xl text-white mb-6">
                                        {service.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-4">{service.title}</h3>
                                    <ul className="space-y-3">
                                        {service.features.map((feat, j) => (
                                            <li key={j} className="text-sm text-zinc-400 flex gap-2 items-start">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                                                {feat}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section >

            {/* FAQ Section */}
            < section className="py-24 px-6 bg-black border-t border-zinc-800" >
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-black text-center text-white mb-16">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        {[
                            {
                                question: "Is there a registration fee?",
                                answer: (
                                    <div className="space-y-4">
                                        <p><span className="font-bold text-red-500">No.</span> Audionix Resellers offers a <span className="text-white font-bold">Free Plan</span> that allows you to start your business with:</p>
                                        <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                                            <li>Access to all listed products</li>
                                            <li>Good wholesale margins</li>
                                            <li>No MOQ and no inventory requirement</li>
                                        </ul>
                                        <p>As your business grows, you can upgrade to a <span className="text-amber-500 font-bold">Premium Plan</span> to access:</p>
                                        <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                                            <li>Higher margins</li>
                                            <li>Priority support</li>
                                            <li>Faster & priority shipping options</li>
                                            <li>Advanced business services</li>
                                        </ul>
                                        <p className="text-sm italic text-zinc-500">Upgrading is optional, not mandatory.</p>
                                    </div>
                                )
                            },
                            {
                                question: "How do I ship products?",
                                answer: (
                                    <div className="space-y-4">
                                        <p>You have two shipping options:</p>
                                        <div className="space-y-3">
                                            <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                                                <h4 className="font-bold text-white mb-2">1. Ship from your end</h4>
                                                <ul className="list-disc pl-5 space-y-1 text-zinc-400 text-sm">
                                                    <li>You place the order with Audionix</li>
                                                    <li>Receive the product</li>
                                                    <li>Ship it to your customer using your own courier and label</li>
                                                </ul>
                                            </div>
                                            <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                                                <h4 className="font-bold text-white mb-2">2. Ship directly from Audionix</h4>
                                                <ul className="list-disc pl-5 space-y-1 text-zinc-400 text-sm">
                                                    <li>We ship the product directly to your customer</li>
                                                    <li>Shipping is done using <span className="text-white">neutral packaging</span> (no Audionix branding)</li>
                                                </ul>
                                            </div>
                                        </div>
                                        <p className="text-sm text-zinc-500">You can choose the shipping method per order based on your business needs.</p>
                                    </div>
                                )
                            },
                            {
                                question: "Can customers pay via COD?",
                                answer: (
                                    <div className="space-y-4">
                                        <p><span className="font-bold text-green-500">Yes, Cash on Delivery (COD) is allowed</span>, but with clear conditions:</p>
                                        <ul className="list-disc pl-5 space-y-2 text-zinc-400">
                                            <li>The reseller must pay the product amount to Audionix in <span className="text-white font-bold">advance</span>.</li>
                                            <li>COD collection and risk are handled by the <span className="text-white font-bold">reseller</span>.</li>
                                            <li>COD is recommended only when the reseller ships from their own end.</li>
                                        </ul>
                                        <p className="p-3 bg-red-900/10 border border-red-900/30 rounded-lg text-red-500 text-sm font-medium">
                                            Audionix does not bear COD risks or losses.
                                        </p>
                                    </div>
                                )
                            },
                            {
                                question: "When do I get my profits?",
                                answer: (
                                    <div className="space-y-4">
                                        <p>Your profit is the difference between:</p>
                                        <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                                            <li>Your selling price to the customer</li>
                                            <li>The wholesale price paid to Audionix</li>
                                        </ul>
                                        <p>Since there is <span className="text-white font-bold">no commission</span>, you earn your margin immediately once the order is completed and payment is collected from your customer.</p>
                                        <p className="text-green-500 font-medium">Audionix does not hold or delay reseller profits.</p>
                                    </div>
                                )
                            }
                        ].map((item, i) => (
                            <div key={i} className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 transition-all duration-300 hover:border-zinc-700">
                                <button
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="w-full flex items-center justify-between p-6 text-left"
                                >
                                    <span className={`text-lg font-bold transition-colors ${openFaq === i ? 'text-red-500' : 'text-white'}`}>
                                        {item.question}
                                    </span>
                                    <span className={`text-zinc-500 transition-transform duration-300 ${openFaq === i ? 'rotate-180 text-red-500' : ''}`}>
                                        {openFaq === i ? <FaMinus /> : <FaPlus />}
                                    </span>
                                </button>
                                <div
                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === i ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}
                                >
                                    <div className="p-6 pt-0 text-zinc-400 leading-relaxed border-t border-zinc-800/50">
                                        {item.answer}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section >

            {/* CTA */}
            < section className="py-24 px-6 bg-zinc-900" >
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-6xl font-black text-white mb-8">Ready to start?</h2>
                    <p className="text-xl text-zinc-400 mb-12">Join our community of successful resellers today. Sign up is free, and the potential is limitless.</p>
                    <Link to="/register" className="inline-block bg-red-600 text-white px-12 py-5 rounded-full font-bold text-xl hover:bg-red-700 transition shadow-2xl shadow-red-600/30">
                        Join Now
                    </Link>
                </div>
            </section >

            {/* Footer */}
            < Footer />

            {/* Modal */}
            {showMeetingModal && <MeetingRequestModal onClose={() => setShowMeetingModal(false)} />}
        </div >
    );
};

export default LandingPage;
