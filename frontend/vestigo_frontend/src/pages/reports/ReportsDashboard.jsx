import { useState, useEffect } from 'react';
import api from '../../services/api';
import { ChartBarIcon, CurrencyDollarIcon, PresentationChartLineIcon, FunnelIcon } from '@heroicons/react/24/outline';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, AreaChart, Area
} from 'recharts';

const ReportsDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('month');
    const [chartType, setChartType] = useState('bar');
    const [data, setData] = useState([]);

    useEffect(() => {
        fetchStats();
    }, [timeRange]); // Refetch when time range changes

    const fetchStats = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/reports/advanced-reports/?range=${timeRange}`);
            setStats(response.data);
            setData(response.data.performance_data || []);
        } catch (error) {
            console.error("Failed to fetch reports", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!stats) return <div className="text-red-500 p-8">Error loading reports data.</div>;

    return (
        <div className="px-4 py-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center sm:justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Executive Reports
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">Detailed analysis and performance metrics.</p>
                </div>
                <div className="mt-4 flex space-x-3 sm:mt-0 sm:ml-4">
                    <span className="isolate inline-flex rounded-md shadow-sm">
                        <button
                            type="button"
                            onClick={() => setTimeRange('month')}
                            className={`relative inline-flex items-center rounded-l-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 focus:z-10 ${timeRange === 'month' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
                        >
                            Month
                        </button>
                        <button
                            type="button"
                            onClick={() => setTimeRange('quarter')}
                            className={`relative -ml-px inline-flex items-center px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 focus:z-10 ${timeRange === 'quarter' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
                        >
                            Quarter
                        </button>
                        <button
                            type="button"
                            onClick={() => setTimeRange('year')}
                            className={`relative -ml-px inline-flex items-center rounded-r-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 focus:z-10 ${timeRange === 'year' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
                        >
                            Year
                        </button>
                    </span>
                </div>
            </div>

            {/* Main Interactive Chart */}
            <div className="bg-white shadow rounded-lg p-6 mb-8" style={{ minHeight: '450px' }}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Performance Overview ({stats.time_range})</h3>
                    <div className="flex space-x-2">
                        <button onClick={() => setChartType('bar')} className={`px-2 py-1 text-xs rounded ${chartType === 'bar' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500'}`}>Bar</button>
                        <button onClick={() => setChartType('line')} className={`px-2 py-1 text-xs rounded ${chartType === 'line' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500'}`}>Line</button>
                        <button onClick={() => setChartType('area')} className={`px-2 py-1 text-xs rounded ${chartType === 'area' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500'}`}>Area</button>
                    </div>
                </div>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'bar' && (
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="sales" fill="#4F46E5" name="New Sales" />
                                <Bar dataKey="claims" fill="#EF4444" name="Claims Paid" />
                            </BarChart>
                        )}
                        {chartType === 'line' && (
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="sales" stroke="#4F46E5" strokeWidth={2} />
                                <Line type="monotone" dataKey="claims" stroke="#EF4444" strokeWidth={2} />
                            </LineChart>
                        )}
                        {chartType === 'area' && (
                            <AreaChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Area type="monotone" dataKey="sales" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.3} />
                                <Area type="monotone" dataKey="claims" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
                            </AreaChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Advanced Metrics Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                    <dt className="truncate text-sm font-medium text-gray-500">Gross Written Premium</dt>
                    <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">${stats.total_premium.toLocaleString()}</dd>
                    <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '70%' }}></div>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">70% of yearly target</p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                    <dt className="truncate text-sm font-medium text-gray-500">Avg Claim Processing</dt>
                    <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{stats.avg_claim_processing || 0} Days</dd>
                    <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${Math.min((10 - (stats.avg_claim_processing || 0)) / 10 * 100, 100)}%` }}></div>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">{stats.processing_benchmark || 'Calculating...'}</p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                    <dt className="truncate text-sm font-medium text-gray-500">Customer Retention</dt>
                    <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{stats.customer_retention || 0}%</dd>
                    <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${stats.customer_retention || 0}%` }}></div>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">{stats.retention_change || 'N/A'} from last period</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ReportsDashboard;
