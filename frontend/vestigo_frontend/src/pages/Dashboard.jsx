import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    CurrencyDollarIcon,
    ClipboardDocumentCheckIcon,
    ChartBarIcon,
    UserGroupIcon,
    ArrowRightIcon,
    PlusIcon,
    BellIcon,
    DocumentPlusIcon,
    UserPlusIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/reports/dashboard-stats/');
                setStats(response.data);
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!stats) return <div className="text-red-500">Error loading dashboard data.</div>;

    // Transform Pipeline Data
    const pipelineData = stats.pipeline ? stats.pipeline.map(item => ({
        name: item.stage.replace('_', ' '),
        count: item.count
    })) : [];

    // Mock Trend Data (keep untill we have real historical data endpoint)
    const trendData = [
        { name: 'Jan', premium: 4000 },
        { name: 'Feb', premium: 3000 },
        { name: 'Mar', premium: 2000 },
        { name: 'Apr', premium: 2780 },
        { name: 'May', premium: 1890 },
        { name: 'Jun', premium: 2390 },
        { name: 'Jul', premium: stats.total_premium > 10000 ? stats.total_premium / 2 : 3490 },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <div className="mb-8">
                <div className="md:flex md:items-center md:justify-between">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                            Executive Dashboard
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">Welcome back, get a quick overview of your insurance operations.</p>
                    </div>
                    <div className="mt-4 flex md:ml-4 md:mt-0 space-x-3">
                        <button
                            type="button"
                            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                            <BellIcon className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                            Notifications
                            {stats.recent_notifications && stats.recent_notifications.length > 0 &&
                                <span className="ml-2 inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">{stats.recent_notifications.length}</span>
                            }
                        </button>
                        <Link
                            to="/help"
                            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            Help Center
                        </Link>
                    </div>
                </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-4">
                <Link to="/leads?action=create" className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group">
                    <UserPlusIcon className="h-6 w-6 text-indigo-600 group-hover:scale-110 transition-transform" />
                    <span className="ml-3 font-medium text-gray-900">Add Lead</span>
                </Link>
                <Link to="/policies?action=create" className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group">
                    <DocumentPlusIcon className="h-6 w-6 text-green-600 group-hover:scale-110 transition-transform" />
                    <span className="ml-3 font-medium text-gray-900">New Quote</span>
                </Link>
                <Link to="/claims" className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group">
                    <ClipboardDocumentCheckIcon className="h-6 w-6 text-red-600 group-hover:scale-110 transition-transform" />
                    <span className="ml-3 font-medium text-gray-900">File Claim</span>
                </Link>
                <Link to="/reports" className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group">
                    <ChartBarIcon className="h-6 w-6 text-purple-600 group-hover:scale-110 transition-transform" />
                    <span className="ml-3 font-medium text-gray-900">Reports</span>
                </Link>
            </div>

            {/* Top Metrics Grid - Enhanced UI with Clickable Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                {/* Metric 1 - Total Premium */}
                <Link to="/policies" className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-6 shadow-lg text-white hover:shadow-xl transition-shadow cursor-pointer">
                    <dt>
                        <div className="absolute rounded-md bg-white/20 p-3">
                            <CurrencyDollarIcon className="h-6 w-6 text-white" aria-hidden="true" />
                        </div>
                        <p className="ml-16 truncate text-sm font-medium text-indigo-100">Total Written Premium</p>
                    </dt>
                    <dd className="ml-16 flex flex-col items-baseline pb-1 sm:pb-2">
                        <p className="text-3xl font-bold">${stats.total_premium.toLocaleString()}</p>
                        <div className="flex items-center mt-2">
                            <ArrowRightIcon className="h-4 w-4 text-green-300 mr-1" />
                            <span className="text-sm text-indigo-200">+12.3% from last month</span>
                        </div>
                    </dd>
                </Link>

                {/* Metric 2 - Claims Impact */}
                <Link to="/claims" className="relative overflow-hidden rounded-xl bg-white p-6 shadow-md border-l-4 border-red-500 hover:shadow-xl transition-shadow cursor-pointer">
                    <dt>
                        <div className="absolute rounded-md bg-red-50 p-3">
                            <ClipboardDocumentCheckIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                        </div>
                        <p className="ml-16 truncate text-sm font-medium text-gray-500">Claims Impact</p>
                    </dt>
                    <dd className="ml-16 flex flex-col items-baseline pb-1 sm:pb-2">
                        <p className="text-2xl font-bold text-gray-900">${stats.total_claims_amount.toLocaleString()}</p>
                        <div className="flex items-center justify-between mt-2 w-full">
                            <span className={`inline-flex items-baseline rounded-full px-2.5 py-0.5 text-sm font-medium ${stats.loss_ratio > 70 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                LR: {stats.loss_ratio}%
                            </span>
                            <span className="text-xs text-gray-500">-2.1% vs last month</span>
                        </div>
                    </dd>
                </Link>

                {/* Metric 3 - Active Pipeline */}
                <Link to="/leads" className="relative overflow-hidden rounded-xl bg-white p-6 shadow-md border-l-4 border-green-500 hover:shadow-xl transition-shadow cursor-pointer">
                    <dt>
                        <div className="absolute rounded-md bg-green-50 p-3">
                            <ChartBarIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
                        </div>
                        <p className="ml-16 truncate text-sm font-medium text-gray-500">Active Pipeline</p>
                    </dt>
                    <dd className="ml-16 flex flex-col items-baseline pb-1 sm:pb-2">
                        <p className="text-2xl font-bold text-gray-900">{stats.pipeline ? stats.pipeline.reduce((acc, curr) => acc + curr.count, 0) : 0} Deals</p>
                        <div className="flex items-center mt-2">
                            <ArrowRightIcon className="h-4 w-4 text-green-600 mr-1" />
                            <span className="text-xs text-green-600 font-medium">+8 new this week</span>
                        </div>
                    </dd>
                </Link>

                {/* Metric 4 - Underwriting Queue */}
                <Link to="/underwriting" className="relative overflow-hidden rounded-xl bg-white p-6 shadow-md border-l-4 border-yellow-500 hover:shadow-xl transition-shadow cursor-pointer">
                    <dt>
                        <div className="absolute rounded-md bg-yellow-50 p-3">
                            <UserGroupIcon className="h-6 w-6 text-yellow-600" aria-hidden="true" />
                        </div>
                        <p className="ml-16 truncate text-sm font-medium text-gray-500">Underwriting Queue</p>
                    </dt>
                    <dd className="ml-16 flex flex-col items-baseline pb-1 sm:pb-2">
                        <p className="text-2xl font-bold text-gray-900">{stats.pending_submissions}</p>
                        <div className="flex items-center mt-2">
                            <span className="text-xs text-yellow-600 font-semibold">Pending Review</span>
                            <span className="text-xs text-gray-500 ml-2">Avg: 2.3 days</span>
                        </div>
                    </dd>
                </Link>
            </div>

            {/* Charts Row - Dedicated single row for charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white shadow-lg rounded-xl p-6" style={{ minHeight: '350px' }}>
                    <h3 className="text-lg font-bold leading-6 text-gray-900 mb-4">Pipeline Distribution</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pipelineData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="count" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                    {pipelineData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white shadow-lg rounded-xl p-6" style={{ minHeight: '350px' }}>
                    <h3 className="text-lg font-bold leading-6 text-gray-900 mb-4">Premium Trend</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: '#f3f4f6' }} />
                                <Bar dataKey="premium" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Main Content Grid - Everything else below charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Left Column (Recent Activity) - Spans 2 cols */}
                <div className="lg:col-span-2">
                    <div className="bg-white shadow-lg rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold leading-6 text-gray-900">Recent Activity</h3>
                            <a href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">View all</a>
                        </div>
                        <div className="flow-root">
                            <ul className="-mb-8">
                                {stats.recent_activities && stats.recent_activities.length > 0 ? (
                                    stats.recent_activities.map((activity, activityIdx) => {
                                        // Dynamic Color Logic for C, M, N
                                        const typeChar = activity.activity_type ? activity.activity_type[0] : 'A';
                                        let bgClass = 'bg-gray-500';
                                        if (typeChar === 'C') bgClass = 'bg-blue-500'; // Call
                                        if (typeChar === 'M') bgClass = 'bg-purple-500'; // Meeting
                                        if (typeChar === 'N') bgClass = 'bg-teal-500'; // Note/New
                                        if (typeChar === 'E') bgClass = 'bg-yellow-500'; // Email

                                        return (
                                            <li key={activity.id}>
                                                <div className="relative pb-8">
                                                    {activityIdx !== stats.recent_activities.length - 1 ? (
                                                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                                    ) : null}
                                                    <div className="relative flex space-x-3">
                                                        <div>
                                                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm ${bgClass}`}>
                                                                <span className="text-white text-sm font-bold">{typeChar}</span>
                                                            </span>
                                                        </div>
                                                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                                            <div>
                                                                <p className="text-sm text-gray-600">
                                                                    <span className="font-medium text-gray-900 mr-1">{activity.activity_type}</span>
                                                                    {activity.notes}
                                                                </p>
                                                            </div>
                                                            <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                                                <time dateTime={activity.created_at}>{new Date(activity.created_at).toLocaleDateString()}</time>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        )
                                    })
                                ) : (
                                    <div className="text-sm text-gray-500 py-4 text-center italic">No recent activity. Start working to see updates here!</div>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Right Column (Notifications, Policy Mix, Expiring Soon) */}
                <div className="space-y-8 w-full">
                    {/* Unread Notifications Box */}
                    <div className="bg-white shadow-lg rounded-xl p-6 border-t-4 border-indigo-500">
                        <h3 className="text-lg font-bold leading-6 text-gray-900 mb-4">Notifications</h3>
                        <ul className="space-y-4">
                            {stats.recent_notifications && stats.recent_notifications.length > 0 ? (
                                stats.recent_notifications.map(notif => (
                                    <li
                                        key={notif.id}
                                        onClick={async () => {
                                            // Mark as read
                                            try {
                                                await api.post(`/notifications/notifications/${notif.id}/mark_read/`);
                                            } catch (err) {
                                                console.error('Failed to mark notification as read', err);
                                            }
                                            // Navigate to link or default
                                            if (notif.link) {
                                                navigate(notif.link);
                                            }
                                        }}
                                        className="flex gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0 cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-2 rounded transition-colors"
                                    >
                                        <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${notif.type === 'WARNING' ? 'bg-red-500' :
                                            notif.type === 'SUCCESS' ? 'bg-green-500' : 'bg-indigo-500'
                                            }`} />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                                            <p className="text-xs text-gray-500">{notif.message}</p>
                                            <p className="text-[10px] text-gray-400 mt-1">{new Date(notif.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </li>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-4">All caught up!</p>
                            )}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Policy Mix and Expiring Soon in One Row - Full Width */}
            <div className="flex flex-col lg:flex-row gap-8 mb-8">
                {/* Policy Mix */}
                <div className="flex-1 bg-white shadow-lg rounded-xl p-6">
                    <h3 className="text-lg font-bold leading-6 text-gray-900 mb-4">Policy Mix</h3>
                    <div className="space-y-4">
                        {stats.policy_distribution && stats.policy_distribution.map((dist, idx) => (
                            <div key={idx}>
                                <div className="flex justify-between text-sm font-medium text-gray-900 mb-1">
                                    <span className="capitalize">{dist.policy_type?.replace('_', ' ').toLowerCase()}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-indigo-600 font-semibold">{dist.percentage}%</span>
                                        <span className="text-gray-500">({dist.count})</span>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 rounded-full transition-all"
                                        style={{ width: `${dist.percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                        {(!stats.policy_distribution || stats.policy_distribution.length === 0) &&
                            <p className="text-sm text-gray-500 text-center">No policies yet.</p>
                        }
                    </div>
                </div>

                {/* Expiring Soon */}
                <div className="flex-1 bg-white shadow-lg rounded-xl p-6">
                    <h3 className="text-lg font-bold leading-6 text-gray-900 mb-4">Expiring Soon</h3>
                    <div className="space-y-3">
                        {stats.upcoming_renewals && stats.upcoming_renewals.length > 0 ? (
                            stats.upcoming_renewals.map((renewal) => {
                                const endDate = new Date(renewal.end_date);
                                const today = new Date();
                                const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
                                let urgencyColor = 'bg-green-100 text-green-800';
                                if (daysRemaining < 7) urgencyColor = 'bg-red-100 text-red-800';
                                else if (daysRemaining < 15) urgencyColor = 'bg-yellow-100 text-yellow-800';

                                return (
                                    <div key={renewal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="flex-1">
                                            <Link to={`/policies/${renewal.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                                                {renewal.policy_number}
                                            </Link>
                                            <p className="text-xs text-gray-500 mt-0.5">{renewal.customer_name}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${urgencyColor}`}>
                                                {daysRemaining}d
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">No upcoming renewals.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>

    );
};

export default Dashboard;
