import { useState, useEffect } from 'react';

import api from '../services/api';
import { FaUsers, FaUserPlus, FaShoppingCart, FaExchangeAlt, FaArrowRight, FaTimes, FaAddressBook } from 'react-icons/fa';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const AdminAnalytics = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('allTime');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    // --- Modal Logic ---
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState(null); // 'registrations' | 'orders'
    const [modalData, setModalData] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);

    useEffect(() => {
        fetchAnalytics();
    }, [filter, customStartDate, customEndDate]);

    const fetchAnalytics = async () => {
        try {
            let query = '';
            if (filter === 'custom' && customStartDate && customEndDate) {
                query = `?startDate=${customStartDate}&endDate=${customEndDate}`;
            }
            const { data } = await api.get(`/admin/analytics${query}`);
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch analytics", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !stats) {
        return <div className="flex justify-center items-center h-screen text-zinc-500">Loading Analytics...</div>;
    }

    // Determine which data bucket to show
    const getActiveData = () => {
        if (filter === 'custom') return stats.analytics?.custom || {};
        return stats.analytics?.[filter] || stats.analytics?.allTime || {};
    };

    const data = getActiveData();

    // Calculations
    const uniqueVisitors = (data.uniqueVisitors || 0); // Don't add registrations, they are already visitors
    const newRegistrations = data.newRegistrations || 0;
    const leads = data.leads || 0;
    const totalOrders = data.totalOrders || 0;

    // Guard against division by zero
    const visitorToRegRate = uniqueVisitors > 0 ? ((newRegistrations / uniqueVisitors) * 100).toFixed(2) : '0.00';
    // For Leads, we compare to Registrations (if typical flow) or Visitors. Let's use Registrations as base for "Active" users.
    const regToLeadRate = newRegistrations > 0 ? ((leads / newRegistrations) * 100).toFixed(2) : '0.00';
    // For Orders, we compare to Leads? Or Registrations?
    // Given orders can happen without leads, this might be > 100%. That's acceptable for this dashboard style.
    const leadToOrderRate = leads > 0 ? ((totalOrders / leads) * 100).toFixed(2) : '0.00';

    // Overall Stats
    const overallConversion = uniqueVisitors > 0 ? ((totalOrders / uniqueVisitors) * 100).toFixed(2) : '0.00';

    const funnelChartData = {
        labels: ['Unique Visitors', 'Registrations', 'Leads', 'Orders'],
        datasets: [
            {
                label: 'Conversion Funnel',
                data: [uniqueVisitors, newRegistrations, leads, totalOrders],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.6)', // Blue
                    'rgba(16, 185, 129, 0.6)', // Green
                    'rgba(236, 72, 153, 0.6)', // Pink (Leads)
                    'rgba(245, 158, 11, 0.6)'  // Orange
                ],
                borderColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(16, 185, 129, 1)',
                    'rgba(236, 72, 153, 1)',
                    'rgba(245, 158, 11, 1)'
                ],
                borderWidth: 1,
            },
        ],
    };

    const FunnelCard = ({ title, value, subtext, icon, color, onClick }) => (
        <div
            onClick={onClick}
            className={`glass-panel p-6 rounded-2xl border border-zinc-800 flex flex-col items-center text-center relative overflow-hidden group hover:border-${color}-500 transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-lg' : ''}`}
        >
            <div className={`p-4 rounded-full bg-${color}-900/20 text-${color}-500 text-3xl mb-4 group-hover:scale-110 transition`}>
                {icon}
            </div>
            <h3 className="text-4xl font-black text-white mb-1">{value}</h3>
            <p className="text-zinc-400 font-bold uppercase text-xs tracking-wider mb-2">{title}</p>
            {subtext && <p className="text-xs text-zinc-500">{subtext}</p>}
        </div>
    );

    // --- Modal Logic ---
    // State moved to top to fix Hook Order Error

    const handleCardClick = async (type) => {
        if (!['registrations', 'orders', 'uniqueVisitors', 'leads'].includes(type)) return;

        setModalType(type === 'uniqueVisitors' ? 'registrations' : type); // Map visitors to registrations view
        setModalOpen(true);
        setModalLoading(true);

        try {
            // For uniqueVisitors, we want to fetch details of who registered (identity)
            // Start query with the mapped type (or actual type if backend supports it separately, but here we reuse registrations)
            let queryType = type === 'uniqueVisitors' ? 'registrations' : type;
            let query = `?type=${queryType}&period=${filter}`;

            if (filter === 'custom' && customStartDate && customEndDate) {
                query += `&startDate=${customStartDate}&endDate=${customEndDate}`;
            }

            const { data } = await api.get(`/admin/analytics/details${query}`);
            setModalData(data);
        } catch (error) {
            console.error(error);
        } finally {
            setModalLoading(false);
        }
    };

    const RateArrow = ({ rate, label }) => (
        <div className="hidden md:flex flex-col items-center justify-center text-zinc-600 px-4">
            <p className="text-xs font-bold mb-1">{label}</p>
            <div className="flex items-center gap-1 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                <FaArrowRight size={12} />
                <span className="text-white font-bold">{rate}%</span>
            </div>
        </div>
    );

    return (
        <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2">
                        Conversion Analytics<span className="text-red-600">.</span>
                    </h1>
                    <p className="text-zinc-400">Deep dive into visitor conversion and funnel performance.</p>
                </div>

                <div className="flex gap-3">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-lg font-bold text-sm outline-none shadow-sm hover:bg-zinc-800 transition"
                    >
                        <option value="allTime">All Time</option>
                        <option value="today">Today</option>
                        <option value="yesterday">Yesterday</option>
                        <option value="lastWeek">Last 7 Days</option>
                        <option value="lastMonth">Last 30 Days</option>
                        <option value="lastYear">Last Year</option>
                        <option value="custom">Custom Range</option>
                    </select>

                    {filter === 'custom' && (
                        <div className="flex gap-2">
                            <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="bg-zinc-900 border-zinc-800 rounded-lg px-2 text-white" />
                            <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="bg-zinc-900 border-zinc-800 rounded-lg px-2 text-white" />
                        </div>
                    )}
                </div>
            </div>

            {/* Funnel Visualization */}
            <div className="mb-12">
                <h2 className="text-xl font-bold text-white mb-6">Sales Funnel</h2>
                <div className="flex flex-col md:flex-row gap-4 items-stretch justify-center">

                    {/* Step 1: Visitors */}
                    <div className="flex-1">
                        <FunnelCard
                            title="Unique Visitors"
                            value={uniqueVisitors}
                            subtext="Potential Resellers"
                            icon={<FaUsers />}
                            color="blue"
                            onClick={() => handleCardClick('uniqueVisitors')}
                        />
                    </div>

                    <RateArrow rate={visitorToRegRate} label="Conversion" />

                    {/* Step 2: Registrations */}
                    <div className="flex-1">
                        <FunnelCard
                            title="New Registrations"
                            value={newRegistrations}
                            subtext="Signed Up Users"
                            icon={<FaUserPlus />}
                            color="green"
                            onClick={() => handleCardClick('registrations')}
                        />
                    </div>

                    <RateArrow rate={regToLeadRate} label="Active" />

                    {/* Step 3: Leads */}
                    <div className="flex-1">
                        <FunnelCard
                            title="Total Leads"
                            value={leads}
                            subtext="Meeting Requests"
                            icon={<FaAddressBook />}
                            color="pink"
                            onClick={() => handleCardClick('leads')}
                        />
                    </div>

                    <RateArrow rate={leadToOrderRate} label="Converted" />

                    {/* Step 4: Orders */}
                    <div className="flex-1">
                        <FunnelCard
                            title="Total Orders"
                            value={totalOrders}
                            subtext="Converted Customers"
                            icon={<FaShoppingCart />}
                            color="orange"
                            onClick={() => handleCardClick('orders')}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Chart */}
                <div className="glass-panel p-6 rounded-2xl border border-zinc-800">
                    <h3 className="font-bold text-white mb-4">Funnel Visualization</h3>
                    <div className="h-[300px] flex items-center justify-center">
                        <Bar
                            data={funnelChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    y: { beginAtZero: true, grid: { color: '#27272a' } },
                                    x: { grid: { display: false } }
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="glass-panel p-6 rounded-2xl border border-zinc-800">
                    <h3 className="font-bold text-white mb-6">Key Conversion Metrics</h3>

                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-zinc-400">Visitor to Registration</span>
                                <span className="text-white font-bold">{visitorToRegRate}%</span>
                            </div>
                            <div className="w-full bg-zinc-900 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(visitorToRegRate, 100)}%` }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-zinc-400">Registration to Lead</span>
                                <span className="text-white font-bold">{regToLeadRate}%</span>
                            </div>
                            <div className="w-full bg-zinc-900 rounded-full h-2">
                                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min(regToLeadRate, 100)}%` }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-zinc-400">Lead to Order</span>
                                <span className="text-white font-bold">{leadToOrderRate}%</span>
                            </div>
                            <div className="w-full bg-zinc-900 rounded-full h-2">
                                <div className="bg-pink-600 h-2 rounded-full" style={{ width: `${Math.min(leadToOrderRate, 100)}%` }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-zinc-400">Overall Conversion (Visitor → Order)</span>
                                <span className="text-white font-bold">{overallConversion}%</span>
                            </div>
                            <div className="w-full bg-zinc-900 rounded-full h-2">
                                <div className="bg-orange-600 h-2 rounded-full" style={{ width: `${Math.min(overallConversion, 100)}%` }}></div>
                            </div>
                        </div>

                        <div className="pt-6 mt-6 border-t border-zinc-800">
                            <div className="flex items-center gap-4 bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                                <div className="p-3 bg-purple-900/20 text-purple-500 rounded-lg">
                                    <FaExchangeAlt size={24} />
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 uppercase font-bold">Total Page Views</p>
                                    <p className="text-2xl font-bold text-white">{data.totalPageViews?.toLocaleString() || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="glass-panel w-full max-w-4xl max-h-[80vh] rounded-3xl border border-zinc-800 flex flex-col shadow-2xl animate-fade-in">
                        <div className="p-6 border-b border-zinc-800 flex justify-between items-center sticky top-0 bg-zinc-900/95 z-10 backdrop-blur-md rounded-t-3xl">
                            <h2 className="text-2xl font-bold text-white capitalize">{modalType} Details</h2>
                            <button onClick={() => setModalOpen(false)} className="text-zinc-400 hover:text-white bg-zinc-800 p-2 rounded-full transition"><FaTimes /></button>
                        </div>

                        <div className="p-0 overflow-y-auto flex-1">
                            {modalLoading ? (
                                <div className="p-10 text-center text-zinc-500">Loading details...</div>
                            ) : modalData.length === 0 ? (
                                <div className="p-10 text-center text-zinc-500">No records found for this period.</div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-zinc-800/50 sticky top-0">
                                        <tr>
                                            <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                                {modalType === 'registrations' || modalType === 'leads' ? 'User' : 'Customer'}
                                            </th>
                                            <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                                Email / Reseller
                                            </th>
                                            <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                                Phone
                                            </th>
                                            <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                                {modalType === 'registrations' || modalType === 'leads' ? 'Joined/Req Date' : 'Amount'}
                                            </th>
                                            <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800">
                                        {modalData.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-zinc-800/30 transition">
                                                <td className="p-4 text-white font-medium">{item.col1}</td>
                                                <td className="p-4 text-zinc-400 text-sm">
                                                    {item.col2}
                                                    {modalType === 'orders' && <div className="text-[10px] text-zinc-600 uppercase font-bold">Reseller</div>}
                                                </td>
                                                <td className="p-4 text-zinc-400 text-sm">{item.col3}</td>
                                                <td className="p-4 text-white font-bold">{item.col4}</td>
                                                <td className="p-4">
                                                    <span className="bg-zinc-800 text-zinc-400 px-2 py-1 rounded text-xs border border-zinc-700 uppercase font-bold">
                                                        {item.extra}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminAnalytics;
