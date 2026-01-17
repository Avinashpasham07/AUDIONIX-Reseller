import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import api from '../services/api';
import MainLayout from '../components/MainLayout';
import { FaUserCheck, FaClipboardCheck, FaBox, FaBoxOpen, FaShippingFast, FaRupeeSign, FaExclamationCircle, FaChartLine, FaUser, FaExchangeAlt, FaHeadset } from 'react-icons/fa';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import MeetingRequestModal from '../components/MeetingRequestModal';
import PlansModal from '../components/PlansModal';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
);

// --- 1. ADMIN DASHBOARD COMPONENT ---
const AdminDashboard = ({ user }) => {
    const hasPermission = (permission) => {
        if (user?.role === 'admin') return true;
        return user?.permissions?.includes(permission);
    };

    const [stats, setStats] = useState({
        allTime: { count: 0, revenue: 0, profit: 0 },
        today: { count: 0, revenue: 0, profit: 0 },
        yesterday: { count: 0, revenue: 0, profit: 0 },
        lastWeek: { count: 0, revenue: 0, profit: 0 },
        lastMonth: { count: 0, revenue: 0, profit: 0 },
        lastYear: { count: 0, revenue: 0, profit: 0 },
        thisMonth: { count: 0, revenue: 0, profit: 0 },
        thisYear: { count: 0, revenue: 0, profit: 0 },
        topProducts: [],
        monthlyData: []
    });
    const [loading, setLoading] = useState(true);
    const [dashboardFilter, setDashboardFilter] = useState('allTime');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                let query = `?period=${dashboardFilter}`;
                if (dashboardFilter === 'custom' && customStartDate && customEndDate) {
                    query += `&startDate=${customStartDate}&endDate=${customEndDate}`;
                }
                const { data } = await api.get(`/admin/analytics${query}`);
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch analytics", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [dashboardFilter, customStartDate, customEndDate]);

    const getFilteredData = () => {
        if (dashboardFilter === 'custom') return stats.custom || { count: 0, revenue: 0, profit: 0 };
        const data = stats[dashboardFilter] || stats.allTime;
        return {
            profit: data.profit || 0,
            revenue: data.revenue || 0,
            count: data.count || 0
        };
    };
    const currentData = getFilteredData();

    const StatCard = ({ title, value, subValue, icon, colorClass }) => (
        <div className="glass-panel p-6 rounded-2xl flex items-start justify-between card-hover border-0">
            <div>
                <p className="text-zinc-400 font-bold text-xs uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-3xl font-black text-white tracking-tight">{value}</h3>
                {subValue && <p className="text-xs font-medium mt-1 text-zinc-500">{subValue}</p>}
            </div>
            <div className={`p-4 rounded-xl text-2xl shadow-sm ${colorClass}`}>
                {icon}
            </div>
        </div>
    );

    const profitChartData = {
        labels: stats.monthlyData?.map(d => d.name) || [],
        datasets: [
            {
                label: 'Net Profit',
                data: stats.monthlyData?.map(d => d.profit) || [],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: (stats.monthlyData?.length || 0) > 15 ? 2 : 5,
                pointHoverRadius: 8,
                pointBackgroundColor: '#10b981',
                borderWidth: 2
            },
            {
                label: 'Revenue',
                data: stats.monthlyData?.map(d => d.revenue) || [],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: (stats.monthlyData?.length || 0) > 15 ? 2 : 5,
                pointHoverRadius: 8,
                pointBackgroundColor: '#3b82f6',
                borderWidth: 2
            }
        ]
    };

    const topProductsChartData = {
        labels: stats.topProducts?.map(p => p.title.length > 20 ? p.title.substring(0, 20) + '...' : p.title) || [],
        datasets: [
            {
                label: 'Units Sold',
                data: stats.topProducts?.map(p => p.count) || [],
                backgroundColor: [
                    'rgba(239, 68, 68, 0.7)',
                    'rgba(59, 130, 246, 0.7)',
                    'rgba(16, 185, 129, 0.7)',
                    'rgba(245, 158, 11, 0.7)',
                    'rgba(139, 92, 246, 0.7)',
                ],
                borderWidth: 0,
                borderRadius: 4
            },
        ],
    };

    return (
        <MainLayout>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2">
                        Command Center<span className="text-red-600">.</span>
                    </h1>
                    <p className="text-zinc-400">Real-time financial and operational overview.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <select
                        value={dashboardFilter}
                        onChange={(e) => setDashboardFilter(e.target.value)}
                        className="flex-1 md:flex-none px-4 py-2.5 bg-zinc-900 border-2 border-red-600 md:border md:border-zinc-800 text-zinc-200 rounded-xl font-bold text-sm outline-none shadow-sm hover:bg-zinc-800 transition focus:ring-2 focus:ring-red-600/20"
                    >
                        <option value="allTime">Overall Total</option>
                        <option value="today">Today's Data</option>
                        <option value="yesterday">Yesterday's Data</option>
                        <option value="lastWeek">Last 7 Days</option>
                        <option value="thisMonth">This Month (Whole)</option>
                        <option value="lastMonth">Last 30 Days</option>
                        <option value="thisYear">This Year (Till Now)</option>
                        <option value="lastYear">Last 1 Year</option>
                        <option value="custom">Date Wise Picker</option>
                    </select>
                    {dashboardFilter === 'custom' && (
                        <div className="flex gap-2 w-full md:w-auto">
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="flex-1 px-4 py-2 bg-zinc-900 border-2 border-red-600 md:border md:border-zinc-800 text-zinc-200 rounded-lg font-bold text-sm outline-none shadow-sm hover:bg-zinc-800 transition"
                            />
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="flex-1 px-4 py-2 bg-zinc-900 border-2 border-red-600 md:border md:border-zinc-800 text-zinc-200 rounded-lg font-bold text-sm outline-none shadow-sm hover:bg-zinc-800 transition"
                            />
                        </div>
                    )}
                    {hasPermission('analytics') && (
                        <Link to="/admin/analytics-view" className="flex-1 md:flex-none px-4 py-2.5 bg-zinc-900 border-2 border-red-600 md:border md:border-zinc-800 text-zinc-200 rounded-xl font-bold text-sm hover:bg-zinc-800 hover:text-white transition flex items-center justify-center gap-2">
                            <FaChartLine className="text-red-500" /> <span className="whitespace-nowrap">Conversions</span>
                        </Link>
                    )}
                    {hasPermission('settings') && (
                        <Link to="/admin/settings" className="flex-1 md:flex-none px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition flex items-center justify-center gap-2 shadow-lg shadow-red-900/20">
                            Settings
                        </Link>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10 opacity-50">Loading Analytics...</div>
            ) : (
                <div className="space-y-8 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {hasPermission('analytics') && (
                            <>
                                <StatCard
                                    title={`Net Profit (${dashboardFilter === 'allTime' ? 'Total' : dashboardFilter})`}
                                    value={`₹${currentData.profit.toLocaleString()}`}
                                    subValue="Earnings after product cost"
                                    icon={<FaRupeeSign />}
                                    colorClass="bg-gradient-to-br from-green-50 to-green-100 text-green-600"
                                />
                                <StatCard
                                    title={`Revenue (${dashboardFilter === 'allTime' ? 'Total' : dashboardFilter})`}
                                    value={`₹${currentData.revenue.toLocaleString()}`}
                                    subValue="Gross Sales Volume"
                                    icon={<FaClipboardCheck />}
                                    colorClass="bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600"
                                />
                            </>
                        )}
                        {hasPermission('orders') && (
                            <StatCard
                                title={`Orders (${dashboardFilter === 'allTime' ? 'Total' : dashboardFilter})`}
                                value={currentData.count}
                                subValue="Total successful orders"
                                icon={<FaBox />}
                                colorClass="bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600"
                            />
                        )}
                    </div>

                    {(hasPermission('analytics') || hasPermission('products')) && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {hasPermission('analytics') && (
                                <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border-2 border-red-600 md:border md:border-zinc-800">
                                    <h3 className="font-bold text-white mb-4">Profit & Revenue Trend</h3>
                                    <div className="h-[300px] flex items-center justify-center">
                                        {stats.monthlyData?.length > 0 ? (
                                            <Line
                                                data={profitChartData}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    interaction: { mode: 'index', intersect: false },
                                                    plugins: {
                                                        legend: {
                                                            position: 'top',
                                                            align: 'end',
                                                            labels: {
                                                                usePointStyle: true,
                                                                pointStyle: 'circle',
                                                                padding: 20,
                                                                color: '#a1a1aa',
                                                                font: { size: 12, weight: 'bold' }
                                                            }
                                                        }
                                                    },
                                                    scales: {
                                                        y: {
                                                            beginAtZero: true,
                                                            grid: { color: 'rgba(39, 39, 42, 0.5)' },
                                                            ticks: { color: '#71717a' }
                                                        },
                                                        x: {
                                                            grid: { display: false },
                                                            ticks: { color: '#71717a' }
                                                        }
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <div className="text-zinc-500 text-sm">No sales data recorded in the last 12 months.</div>
                                        )}
                                    </div>
                                </div>
                            )}
                            {(hasPermission('analytics') || hasPermission('products')) && (
                                <div className="glass-panel p-6 rounded-2xl border-2 border-red-600 md:border md:border-zinc-800 flex flex-col">
                                    <h3 className="font-bold text-white mb-4">Top Selling Products</h3>
                                    <div className="flex-1 flex items-center justify-center h-[300px]">
                                        <Doughnut
                                            data={topProductsChartData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: {
                                                        position: 'bottom',
                                                        labels: { boxWidth: 12, font: { size: 10 } }
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {hasPermission('orders') && (
                            <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border-2 border-red-600 md:border md:border-zinc-800 h-full">
                                <h3 className="font-bold text-white mb-6">Recent Transactions</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-zinc-900 text-zinc-400 border-b-2 border-red-600 md:border-b md:border-zinc-800 uppercase text-xs font-bold">
                                            <tr>
                                                <th className="p-3">Date</th>
                                                <th className="p-3">Reseller</th>
                                                <th className="p-3">Customer</th>
                                                <th className="p-3">Status</th>
                                                <th className="p-3 text-right">Amount</th>
                                                <th className="p-3 text-right">Profit</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y-2 divide-red-600 md:divide-y md:divide-zinc-800">
                                            {stats.recentOrders?.length > 0 ? (
                                                stats.recentOrders.map((order, i) => (
                                                    <tr key={i}>
                                                        <td className="p-3 font-medium text-white">{new Date(order.date).toLocaleDateString()}</td>
                                                        <td className="p-3 font-medium text-zinc-300 truncate max-w-[120px]" title={order.reseller}>{order.reseller}</td>
                                                        <td className="p-3 text-zinc-400 truncate max-w-[120px]" title={order.customer}>{order.customer}</td>
                                                        <td className="p-3">
                                                            <span className={`px-2 py-1 rounded text-xs font-bold ${order.status === 'delivered' ? 'bg-green-900/20 text-green-400' :
                                                                order.status === 'pending' ? 'bg-yellow-900/20 text-yellow-500' :
                                                                    'bg-blue-900/20 text-blue-400'
                                                                }`}>
                                                                {order.status}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-right font-bold text-white">₹{(order.amount || 0).toLocaleString()}</td>
                                                        <td className="p-3 text-right font-bold text-green-500">₹{(order.profit || 0).toLocaleString()}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="6" className="p-4 text-center text-zinc-500">No recent transactions found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {hasPermission('orders') && (
                            <div className="glass-panel p-6 rounded-2xl border-2 border-red-600 md:border md:border-zinc-800 flex flex-col h-full">
                                <h3 className="font-bold text-white mb-4">Order Status</h3>
                                <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                                    {Object.entries(stats.statusDistribution || {}).map(([status, count]) => (
                                        <div key={status} className="flex justify-between items-center bg-zinc-900 p-3 rounded-xl border-2 border-red-600 md:border md:border-zinc-800">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${status === 'delivered' ? 'bg-green-500' :
                                                    status === 'shipped' ? 'bg-blue-500' :
                                                        status === 'cancelled' ? 'bg-red-500' :
                                                            'bg-yellow-500'
                                                    }`} />
                                                <span className="text-sm font-medium text-zinc-300 capitalize">{status.replace(/_/g, ' ')}</span>
                                            </div>
                                            <span className="font-bold text-white">{count}</span>
                                        </div>
                                    ))}
                                    {Object.keys(stats.statusDistribution || {}).length === 0 && (
                                        <p className="text-center text-zinc-400 text-sm py-4">No order status data available.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="glass-panel bg-zinc-900/50 p-6 rounded-2xl border-2 border-red-600 md:border md:border-zinc-800 flex flex-col gap-3">
                            <h3 className="font-bold text-white mb-2">Quick Actions</h3>
                            {hasPermission('orders') && (
                                <Link to="/admin/orders" className="p-4 bg-zinc-900 rounded-xl border-2 border-red-600 md:border md:border-zinc-800 hover:border-blue-500 hover:shadow-md transition flex items-center gap-3">
                                    <div className="p-2 bg-blue-900/30 text-blue-400 rounded-lg"><FaClipboardCheck /></div>
                                    <div className="font-bold text-zinc-200">Verify Pending Orders</div>
                                </Link>
                            )}
                            {hasPermission('resellers') && (
                                <Link to="/admin/resellers" className="p-4 bg-zinc-900 rounded-xl border-2 border-red-600 md:border md:border-zinc-800 hover:border-purple-500 hover:shadow-md transition flex items-center gap-3">
                                    <div className="p-2 bg-purple-900/30 text-purple-400 rounded-lg"><FaUserCheck /></div>
                                    <div className="font-bold text-zinc-200">Manage Resellers</div>
                                </Link>
                            )}
                            {hasPermission('products') && (
                                <Link to="/admin/products" className="p-4 bg-zinc-900 rounded-xl border-2 border-red-600 md:border md:border-zinc-800 hover:border-pink-500 hover:shadow-md transition flex items-center gap-3">
                                    <div className="p-2 bg-pink-900/30 text-pink-400 rounded-lg"><FaBoxOpen /></div>
                                    <div className="font-bold text-zinc-200">Manage Inventory</div>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
};

// --- 2. RESELLER DASHBOARD COMPONENT ---
const ResellerDashboard = ({ user }) => {
    const { setUser } = useContext(AuthContext);
    const [stats, setStats] = useState({
        totalOrders: 0,
        shippedOrders: 0,
        totalEarnings: 0,
        pendingAction: 0,
        monthlyEarnings: [],
        topProducts: [],
        earningsData: {}
    });
    const [loading, setLoading] = useState(true);
    const [dashboardFilter, setDashboardFilter] = useState('allTime');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.accountStatus === 'approved') {
            const hasSeen = localStorage.getItem('reseller_first_login_seen');
            if (!hasSeen) {
                setShowWelcomeModal(true);
            }
        }
    }, [user]);

    const handleCloseWelcome = () => {
        setShowWelcomeModal(false);
        localStorage.setItem('reseller_first_login_seen', 'true');
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                let query = '';
                if (dashboardFilter === 'custom' && customStartDate && customEndDate) {
                    query = `?startDate=${customStartDate}&endDate=${customEndDate}`;
                }
                const { data } = await api.get(`/orders/stats${query}`);
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [dashboardFilter, customStartDate, customEndDate]);

    const getFilteredStats = () => {
        if (dashboardFilter === 'custom') return stats.earningsData?.custom || { orders: 0, profit: 0, revenue: 0 };
        return stats.earningsData?.[dashboardFilter] || stats.earningsData?.allTime || { orders: 0, profit: 0, revenue: 0 };
    };

    const filteredStats = getFilteredStats();

    const earningsChartData = {
        labels: stats.monthlyEarnings?.map(d => d.name) || [],
        datasets: [{
            label: 'Earnings (₹)',
            data: stats.monthlyEarnings?.map(d => d.earnings) || [],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.7)',
            tension: 0.4,
            fill: true
        }]
    };

    const topProductsChartData = {
        labels: stats.topProducts?.map(p => p.title.length > 20 ? p.title.substring(0, 20) + '...' : p.title) || [],
        datasets: [{
            label: 'Units Sold',
            data: stats.topProducts?.map(p => p.count) || [],
            backgroundColor: [
                'rgba(59, 130, 246, 0.8)',
                'rgba(16, 185, 129, 0.8)',
                'rgba(245, 158, 11, 0.8)',
                'rgba(239, 68, 68, 0.8)',
                'rgba(139, 92, 246, 0.8)',
            ],
            borderWidth: 0,
            hoverOffset: 4
        }]
    };

    const StatCard = ({ title, value, icon, gradient, iconColor, textColor, onClick }) => (
        <div
            onClick={onClick}
            className={`glass-panel p-3 md:p-6 rounded-xl md:rounded-2xl flex flex-col gap-2 md:gap-4 border-2 border-red-600 md:border md:border-zinc-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 bg-zinc-900 ${onClick ? 'cursor-pointer hover:border-zinc-700' : ''}`}
        >
            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform duration-500`}>
                <div className={`text-6xl md:text-9xl ${textColor}`}>{icon}</div>
            </div>
            <div className="flex justify-between items-start z-10 relative">
                <div className={`p-2 md:p-3 rounded-lg md:rounded-xl text-lg md:text-xl ${gradient} ${iconColor} shadow-inner`}>
                    {icon}
                </div>
                {title === 'Pending Action' && value > 0 && (
                    <span className="bg-red-900/20 text-red-500 border border-red-900/30 text-[10px] md:text-xs px-2 py-0.5 md:px-2.5 md:py-1 rounded-full font-bold animate-pulse whitespace-nowrap">Action</span>
                )}
            </div>
            <div className="z-10 relative">
                <div className="text-zinc-500 font-medium text-[10px] md:text-sm mb-0.5 md:mb-1 truncate">{title}</div>
                <div className="text-lg md:text-3xl font-black text-white tracking-tight">{value}</div>
            </div>
        </div>
    );

    const HistoryRow = ({ period, data }) => (
        <tr>
            <td className="p-4 font-medium text-white">{period}</td>
            <td className="p-4 text-center text-zinc-400">{data?.orders || 0}</td>
            <td className="p-4 text-center font-bold text-white">₹{(data?.revenue || 0).toLocaleString()}</td>
            <td className="p-4 text-right font-bold text-green-500">₹{(data?.profit || 0).toLocaleString()}</td>
        </tr>
    );

    return (
        <MainLayout>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2">
                        Dashboard<span className="text-red-600">.</span>
                    </h1>
                    <p className="text-zinc-400 text-sm md:text-base">Overview of your business performance.</p>
                </div>
                <div className="flex gap-3">
                    <select
                        value={dashboardFilter}
                        onChange={(e) => setDashboardFilter(e.target.value)}
                        className="px-4 py-2 bg-zinc-900 border-2 border-red-600 md:border md:border-zinc-800 text-zinc-200 rounded-lg font-bold text-sm outline-none shadow-sm hover:bg-zinc-800 transition"
                    >
                        <option value="allTime">All Time</option>
                        <option value="today">Today</option>
                        <option value="yesterday">Yesterday</option>
                        <option value="lastWeek">Last 7 Days</option>
                        <option value="lastMonth">Last 30 Days</option>
                        <option value="lastYear">Last Year</option>
                        <option value="custom">Custom Range</option>
                    </select>
                    {dashboardFilter === 'custom' && (
                        <div className="flex gap-2">
                            <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="px-4 py-2 bg-zinc-900 border-2 border-red-600 md:border md:border-zinc-800 text-zinc-200 rounded-lg font-bold text-sm outline-none shadow-sm hover:bg-zinc-800 transition" />
                            <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="px-4 py-2 bg-zinc-900 border-2 border-red-600 md:border md:border-zinc-800 text-zinc-200 rounded-lg font-bold text-sm outline-none shadow-sm hover:bg-zinc-800 transition" />
                        </div>
                    )}
                    <button onClick={() => setShowMeetingModal(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 transition flex items-center gap-2 shadow-lg shadow-green-900/20">
                        <FaHeadset /> Schedule Call
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="space-y-8 animate-pulse text-zinc-500 text-center py-20">Loading Dashboard...</div>
            ) : (
                <div className="space-y-8 animate-fadeIn">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard title="Total Orders" value={filteredStats.orders} icon={<FaBoxOpen />} gradient="bg-blue-900/20" iconColor="text-blue-500" textColor="text-blue-500" onClick={() => navigate('/orders?status=all')} />
                        <StatCard title="Orders Shipped" value={stats.shippedOrders} icon={<FaShippingFast />} gradient="bg-purple-900/20" iconColor="text-purple-500" textColor="text-purple-500" onClick={() => navigate('/orders?status=shipped')} />
                        <StatCard title="Total Earnings" value={`₹${filteredStats.profit?.toLocaleString()}`} icon={<FaRupeeSign />} gradient="bg-emerald-900/20" iconColor="text-emerald-500" textColor="text-emerald-500" onClick={() => navigate('/orders?status=delivered')} />
                        <StatCard title="Pending Action" value={stats.pendingAction} icon={<FaExclamationCircle />} gradient="bg-orange-900/20" iconColor="text-orange-500" textColor="text-orange-500" onClick={() => navigate('/orders?status=pending')} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border-2 border-red-600 md:border md:border-zinc-800 shadow-sm">
                            <h3 className="font-bold text-white mb-4">Earnings Growth</h3>
                            <div className="h-[300px]">
                                <Bar
                                    data={earningsChartData}
                                    options={{
                                        responsive: true, maintainAspectRatio: false,
                                        scales: { y: { beginAtZero: true, grid: { color: '#27272a' } }, x: { grid: { display: false } } },
                                        plugins: { legend: { display: false } }
                                    }}
                                />
                            </div>
                        </div>
                        <div className="glass-panel p-6 rounded-2xl border-2 border-red-600 md:border md:border-zinc-800 shadow-sm flex flex-col">
                            <h3 className="font-bold text-white mb-4">Top Products</h3>
                            <div className="flex-1 flex items-center justify-center h-[300px]">
                                <Doughnut
                                    data={topProductsChartData}
                                    options={{
                                        responsive: true, maintainAspectRatio: false,
                                        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } } }
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border-2 border-red-600 md:border md:border-zinc-800 shadow-sm h-full">
                            <h3 className="font-bold text-white mb-6">Recent Transactions</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-zinc-900 text-zinc-400 border-b-2 border-red-600 md:border-b md:border-zinc-800 uppercase text-xs font-bold">
                                        <tr>
                                            <th className="p-3">Date</th>
                                            <th className="p-3">Customer</th>
                                            <th className="p-3">Status</th>
                                            <th className="p-3 text-right">Amount</th>
                                            <th className="p-3 text-right">Profit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y-2 divide-red-600 md:divide-y md:divide-zinc-800">
                                        {stats.recentOrders?.length > 0 ? (
                                            stats.recentOrders.map((order, i) => (
                                                <tr key={i}>
                                                    <td className="p-3 font-medium text-white">{new Date(order.date).toLocaleDateString()}</td>
                                                    <td className="p-3 font-medium text-zinc-300 truncate max-w-[120px]" title={order.customer}>{order.customer}</td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${order.status === 'delivered' ? 'bg-green-900/20 text-green-400' :
                                                            order.status === 'pending' ? 'bg-yellow-900/20 text-yellow-500' :
                                                                'bg-blue-900/20 text-blue-400'
                                                            }`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-right font-bold text-white">₹{(order.amount || 0).toLocaleString()}</td>
                                                    <td className="p-3 text-right font-bold text-green-500">₹{(order.profit || 0).toLocaleString()}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan="5" className="p-4 text-center text-zinc-500">No recent transactions found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="glass-panel p-6 rounded-2xl border-2 border-red-600 md:border md:border-zinc-800 shadow-sm flex flex-col h-full">
                            <h3 className="font-bold text-white mb-4">Order Status</h3>
                            <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                                {Object.entries(stats.statusDistribution || {}).map(([status, count]) => (
                                    <div key={status} className="flex justify-between items-center bg-zinc-900 p-3 rounded-xl border-2 border-red-600 md:border md:border-zinc-800">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${status === 'delivered' ? 'bg-green-500' : status === 'shipped' ? 'bg-blue-500' : status === 'cancelled' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                                            <span className="text-sm font-medium text-zinc-300 capitalize">{status.replace(/_/g, ' ')}</span>
                                        </div>
                                        <span className="font-bold text-white">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showMeetingModal && <MeetingRequestModal onClose={() => setShowMeetingModal(false)} />}
            {showWelcomeModal && (
                <PlansModal
                    user={user}
                    onClose={handleCloseWelcome}
                    onUpdateUser={setUser}
                />
            )}
        </MainLayout>
    );
};

// --- 3. HELPER VIEWS ---
const PendingResellerView = ({ user }) => (
    <MainLayout>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
            <div className="glass-panel" style={{ padding: '3rem', borderRadius: '16px', maxWidth: '500px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
                <h2 className="text-gradient">Verification in Progress</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                    Thank you for registering! Our team is currently reviewing your business details.
                    <br /><br />
                    <strong>Verify Mobile:</strong> {user.mobileNumber || 'N/A'}<br />
                    <strong>Verify GST:</strong> {user.businessDetails?.gstNumber || 'N/A'}
                </p>
                <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>You will receive an email once approved.</p>
            </div>
        </div>
    </MainLayout>
);

const RejectedResellerView = () => (
    <MainLayout>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
            <div className="glass-panel" style={{ padding: '3rem', borderRadius: '16px', maxWidth: '500px', border: '1px solid var(--error)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
                <h2 style={{ color: 'var(--error)' }}>Account Rejected</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                    Unfortunately, your reseller application has been rejected.
                    Please contact support for more details.
                </p>
            </div>
        </div>
    </MainLayout>
);

// --- 4. MAIN DASHBOARD DISPATCHER ---
const Dashboard = () => {
    const { user } = useContext(AuthContext);

    if (!user) return null;

    if (user.role === 'admin' || user.role === 'employee') {
        return <AdminDashboard user={user} />;
    }

    if (user.role === 'reseller') {
        if (user.accountStatus === 'pending') return <PendingResellerView user={user} />;
        if (user.accountStatus === 'rejected') return <RejectedResellerView user={user} />;
        if (user.accountStatus === 'approved') return <ResellerDashboard user={user} />;
    }

    return (
        <MainLayout>
            <div className="p-10 text-center text-zinc-500">
                Unauthorized access or invalid role.
            </div>
        </MainLayout>
    );
};

export default Dashboard;
