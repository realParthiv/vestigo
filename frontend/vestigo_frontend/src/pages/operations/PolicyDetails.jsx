import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
    ArrowLeftIcon,
    DocumentTextIcon,
    ClipboardDocumentCheckIcon,
    UserIcon,
    CurrencyDollarIcon,
    CalendarIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon
} from '@heroicons/react/24/outline';

const PolicyDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [policyData, setPolicyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
    const [claimFormData, setClaimFormData] = useState({
        claim_number: '',
        incident_date: '',
        description: '',
        claim_amount: ''
    });
    const [paymentActionLoading, setPaymentActionLoading] = useState(false);
    const [policyActionLoading, setPolicyActionLoading] = useState(false);
    const [scheduleLoading, setScheduleLoading] = useState(false);

    useEffect(() => {
        fetchPolicyDetails();
    }, [id]);

    const fetchPolicyDetails = async () => {
        try {
            const response = await api.get(`/operations/policies/${id}/details/`);
            setPolicyData(response.data);
        } catch (err) {
            console.error('Failed to fetch policy details', err);
            setError('Failed to load policy details');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error || !policyData) {
        return (
            <div className="px-4 py-4 sm:px-6 lg:px-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">{error || 'Policy not found'}</p>
                    <button
                        onClick={() => navigate('/policies')}
                        className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                    >
                        Back to Policies
                    </button>
                </div>
            </div>
        );
    }

    const { policy, customer, claims, statistics } = policyData;

    const handlePolicyAction = async (action) => {
        setPolicyActionLoading(true);
        try {
            await api.post(`/operations/policies/${id}/${action}/`);
            await fetchPolicyDetails();
        } catch (err) {
            alert('Policy action failed');
        } finally {
            setPolicyActionLoading(false);
        }
    };

    const handlePaymentAction = async (paymentId, action, payload = {}) => {
        setPaymentActionLoading(true);
        try {
            await api.post(`/operations/payments/${paymentId}/${action}/`, payload);
            await fetchPolicyDetails();
        } catch (err) {
            alert('Payment action failed');
        } finally {
            setPaymentActionLoading(false);
        }
    };

    const handleGenerateSchedule = async () => {
        const count = parseInt(prompt('Number of installments?', '12'), 10);
        if (!count || count <= 0) return;
        setScheduleLoading(true);
        try {
            await api.post(`/operations/policies/${id}/generate-schedule/`, { count });
            await fetchPolicyDetails();
        } catch (err) {
            alert('Schedule generation failed');
        } finally {
            setScheduleLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusStyles = {
            'ACTIVE': 'bg-green-100 text-green-800',
            'EXPIRED': 'bg-gray-100 text-gray-800',
            'CANCELLED': 'bg-red-100 text-red-800',
            'APPROVED': 'bg-green-100 text-green-800',
            'REJECTED': 'bg-red-100 text-red-800',
            'SUBMITTED': 'bg-blue-100 text-blue-800',
            'IN_REVIEW': 'bg-yellow-100 text-yellow-800'
        };
        return statusStyles[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="px-4 py-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-6">
                <Link
                    to="/policies"
                    className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 mb-4"
                >
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    Back to Policies
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Policy Details</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            {policy.policy_number} • {policy.policy_type}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(policy.status)}`}>
                            {policy.status}
                        </span>
                        <div className="flex gap-2">
                            <button
                                className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                                onClick={() => {
                                    const count = prompt('How many installments do you want to generate?', '12');
                                    if (!count) return;
                                    const ok = confirm(`Generate a payment schedule with ${count} installments?`);
                                    if (!ok) return;
                                    setScheduleLoading(true);
                                    api.post(`/operations/policies/${id}/generate-schedule/`, { count: parseInt(count, 10) })
                                        .then(() => fetchPolicyDetails())
                                        .catch(() => alert('Schedule generation failed'))
                                        .finally(() => setScheduleLoading(false));
                                }}
                                disabled={scheduleLoading}
                            >
                                <CalendarIcon className="h-4 w-4" />
                                Generate Schedule
                            </button>
                            {policy.status === 'ACTIVE' && (
                                <button
                                    className="inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50"
                                    onClick={() => {
                                        const ok = confirm('Are you sure you want to cancel this policy? This action cannot be undone.');
                                        if (ok) handlePolicyAction('cancel');
                                    }}
                                    disabled={policyActionLoading}
                                >
                                    <XCircleIcon className="h-4 w-4" />
                                    Cancel Policy
                                </button>
                            )}
                            {policy.status === 'ACTIVE' && (
                                <button
                                    className="inline-flex items-center gap-1 rounded-md bg-gray-700 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-600 disabled:opacity-50"
                                    onClick={() => {
                                        const ok = confirm('Mark this policy as expired?');
                                        if (ok) handlePolicyAction('expire');
                                    }}
                                    disabled={policyActionLoading}
                                >
                                    <ClockIcon className="h-4 w-4" />
                                    Mark Expired
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Late Charges Summary - if any exist */}
            {policyData.payments && policyData.payments.some(p => p.late_charge) && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <span className="text-2xl">⚠️</span>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-bold text-yellow-900">Late Payment Charges Applied</h3>
                            <p className="text-sm text-yellow-800 mt-1">
                                This policy has {policyData.payments.filter(p => p.late_charge).length} late charge(s) applied to overdue payments.
                                {policyData.payments.filter(p => p.late_charge && !p.late_charge.waived).length > 0 && (
                                    <>
                                        {' '}
                                        Total active charges: <strong>${policyData.payments
                                            .filter(p => p.late_charge && !p.late_charge.waived)
                                            .reduce((sum, p) => sum + parseFloat(p.late_charge.charge_amount), 0)
                                            .toLocaleString()}</strong>
                                    </>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Coverage Alert - claims exceeding premium */}
            {statistics.claim_exceeds_premium && (
                <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <span className="text-2xl">🚨</span>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-bold text-red-900">Approved Claims Exceed Policy Premium</h3>
                            <p className="text-sm text-red-800 mt-1">
                                Approved claim total has exceeded this policy's premium amount. Remaining coverage: <strong>${parseFloat(statistics.remaining_coverage || 0).toLocaleString()}</strong>.
                            </p>
                            {policy.status === 'ACTIVE' && (
                                <div className="mt-3">
                                    <button
                                        className="inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                                        onClick={() => {
                                            const ok = confirm('Approved payouts exceed premium. Expire this policy now?');
                                            if (ok) handlePolicyAction('expire');
                                        }}
                                    >
                                        Mark Expired
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Policy & Customer Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Policy Information */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                <DocumentTextIcon className="h-5 w-5 mr-2 text-indigo-600" />
                                Policy Information
                            </h3>
                        </div>
                        <div className="px-6 py-4 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Policy Number</p>
                                <p className="mt-1 text-sm text-gray-900">{policy.policy_number}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Policy Type</p>
                                <p className="mt-1 text-sm text-gray-900">{policy.policy_type}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Premium Amount</p>
                                <p className="mt-1 text-sm text-gray-900 font-semibold">${parseFloat(policy.premium_amount).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Status</p>
                                <p className="mt-1 text-sm text-gray-900">{policy.status}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Start Date</p>
                                <p className="mt-1 text-sm text-gray-900">{new Date(policy.start_date).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">End Date</p>
                                <p className="mt-1 text-sm text-gray-900">{new Date(policy.end_date).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Duration</p>
                                <p className="mt-1 text-sm text-gray-900">{statistics.policy_duration_days} days</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Created</p>
                                <p className="mt-1 text-sm text-gray-900">{new Date(policy.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Customer Information */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                <UserIcon className="h-5 w-5 mr-2 text-indigo-600" />
                                Customer Information
                            </h3>
                        </div>
                        <div className="px-6 py-4 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Name</p>
                                <p className="mt-1 text-sm text-gray-900">{customer.first_name} {customer.last_name}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Company</p>
                                <p className="mt-1 text-sm text-gray-900">{customer.company_name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Email</p>
                                <p className="mt-1 text-sm text-gray-900">{customer.email}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Phone</p>
                                <p className="mt-1 text-sm text-gray-900">{customer.phone}</p>
                            </div>
                        </div>
                    </div>

                    {/* Premium Payment History */}
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                <CurrencyDollarIcon className="h-5 w-5 mr-2 text-indigo-600" />
                                Premium Payment History
                            </h3>
                        </div>
                        <div className="px-6 py-4">
                            {policyData.payments && policyData.payments.length > 0 ? (
                                <>
                                    {/* Payment Summary Cards */}
                                    {(() => {
                                        // Financial calculations with edge case handling
                                        const payments = policyData.payments || [];
                                        const today = new Date();

                                        const totalDue = payments.reduce((sum, p) => {
                                            const amount = parseFloat(p.amount_due) || 0;
                                            return sum + amount;
                                        }, 0);

                                        const totalPaid = payments.reduce((sum, p) => {
                                            const amount = parseFloat(p.amount_paid) || 0;
                                            return sum + (amount || 0);
                                        }, 0);

                                        const totalOutstanding = totalDue - totalPaid;
                                        const paidPercentage = totalDue > 0 ? ((totalPaid / totalDue) * 100).toFixed(1) : 0;

                                        const paidCount = payments.filter(p => p.status === 'PAID').length;
                                        const overdueCount = payments.filter(p => (p.is_overdue) || (p.status !== 'PAID' && new Date(p.due_date) < today)).length;
                                        const pendingCount = payments.filter(p => p.status === 'PENDING' && !(p.status !== 'PAID' && new Date(p.due_date) < today)).length;
                                        const failedCount = payments.filter(p => p.status === 'FAILED').length;

                                        return (
                                            <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {/* Total Due */}
                                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                                                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Total Due</p>
                                                    <p className="mt-2 text-2xl font-bold text-blue-900">${totalDue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                                                    <p className="mt-1 text-xs text-blue-700">{policyData.payments.length} installments</p>
                                                </div>

                                                {/* Total Paid */}
                                                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                                                    <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Total Paid</p>
                                                    <p className="mt-2 text-2xl font-bold text-green-900">${totalPaid.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                                                    <p className="mt-1 text-xs text-green-700">{paidCount} paid</p>
                                                </div>

                                                {/* Outstanding */}
                                                <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-4">
                                                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Outstanding</p>
                                                    <p className="mt-2 text-2xl font-bold text-amber-900">${totalOutstanding.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                                                    <p className="mt-1 text-xs text-amber-700">{pendingCount + overdueCount} remaining</p>
                                                </div>

                                                {/* Collection Rate */}
                                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
                                                    <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Collection Rate</p>
                                                    <p className="mt-2 text-2xl font-bold text-purple-900">{paidPercentage}%</p>
                                                    <div className="mt-2 w-full bg-purple-300 rounded-full h-2">
                                                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${Math.min(paidPercentage, 100)}%` }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Status Breakdown */}
                                    <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-xs">
                                        {(() => {
                                            const payments = policyData.payments || [];
                                            const today = new Date();
                                            const paid = payments.filter(p => p.status === 'PAID').length;
                                            const overdue = payments.filter(p => (p.is_overdue) || (p.status !== 'PAID' && new Date(p.due_date) < today)).length;
                                            const pending = payments.filter(p => p.status === 'PENDING' && !(p.status !== 'PAID' && new Date(p.due_date) < today)).length;
                                            const failed = payments.filter(p => p.status === 'FAILED').length;

                                            return (
                                                <>
                                                    <div className="bg-green-50 rounded p-3">
                                                        <p className="font-semibold text-green-700">{paid}</p>
                                                        <p className="text-green-600">Paid</p>
                                                    </div>
                                                    <div className="bg-blue-50 rounded p-3">
                                                        <p className="font-semibold text-blue-700">{pending}</p>
                                                        <p className="text-blue-600">Pending</p>
                                                    </div>
                                                    <div className="bg-red-50 rounded p-3">
                                                        <p className="font-semibold text-red-700">{overdue}</p>
                                                        <p className="text-red-600">Overdue</p>
                                                    </div>
                                                    <div className="bg-gray-50 rounded p-3">
                                                        <p className="font-semibold text-gray-700">{failed}</p>
                                                        <p className="text-gray-600">Failed</p>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>

                                    {/* Payment Chart */}
                                    <div className="mb-6">
                                        <ResponsiveContainer width="100%" height={250}>
                                            <BarChart data={policyData.payments.slice(0, 12).reverse()}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis
                                                    dataKey="due_date"
                                                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short' })}
                                                />
                                                <YAxis />
                                                <Tooltip
                                                    formatter={(value) => `$${parseFloat(value).toLocaleString()}`}
                                                    labelFormatter={(label) => `Due: ${new Date(label).toLocaleDateString()}`}
                                                />
                                                <Legend />
                                                <Bar dataKey="amount_due" fill="#4F46E5" name="Amount Due" />
                                                <Bar dataKey="amount_paid" fill="#10B981" name="Amount Paid" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Payment List */}
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-medium text-gray-700 mb-3">All Payments ({policyData.payments.length} total)</h4>
                                        {policyData.payments.map((payment) => {
                                            const statusStyles = {
                                                'PAID': 'bg-green-100 text-green-800',
                                                'PENDING': 'bg-blue-100 text-blue-800',
                                                'OVERDUE': 'bg-red-100 text-red-800',
                                                'FAILED': 'bg-gray-100 text-gray-800'
                                            };

                                            return (
                                                <div key={payment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div>
                                                            <p className="font-medium text-sm text-gray-900">{payment.payment_number}</p>
                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                Due: {new Date(payment.due_date).toLocaleDateString()}
                                                                {payment.paid_date && ` • Paid: ${new Date(payment.paid_date).toLocaleDateString()}`}
                                                            </p>
                                                        </div>
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusStyles[payment.status]}`}>
                                                            {payment.status}
                                                            {payment.is_overdue && payment.status !== 'PAID' && ` (${payment.days_overdue}d)`}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        <div>
                                                            <span className="font-medium text-gray-600">Amount Due:</span>
                                                            <span className="ml-1 text-gray-900">${parseFloat(payment.amount_due).toLocaleString()}</span>
                                                        </div>
                                                        {payment.amount_paid && (
                                                            <div>
                                                                <span className="font-medium text-gray-600">Amount Paid:</span>
                                                                <span className="ml-1 text-green-600 font-semibold">${parseFloat(payment.amount_paid).toLocaleString()}</span>
                                                            </div>
                                                        )}
                                                        {payment.payment_method && (
                                                            <div>
                                                                <span className="font-medium text-gray-600">Method:</span>
                                                                <span className="ml-1 text-gray-900">{payment.payment_method.replace('_', ' ')}</span>
                                                            </div>
                                                        )}
                                                        {payment.transaction_id && (
                                                            <div className="col-span-2">
                                                                <span className="font-medium text-gray-600">Transaction ID:</span>
                                                                <span className="ml-1 text-gray-900 font-mono text-xs">{payment.transaction_id}</span>
                                                            </div>
                                                        )}
                                                        {payment.late_charge && (
                                                            <div className="col-span-2 bg-yellow-50 border-l-4 border-yellow-400 rounded p-3 mt-2">
                                                                <div className="space-y-2">
                                                                    <div className="flex items-start justify-between">
                                                                        <div>
                                                                            <p className="text-xs font-bold text-yellow-900 uppercase">⚠️ Late Payment Charge Applied</p>
                                                                        </div>
                                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                                            payment.late_charge.waived 
                                                                                ? 'bg-gray-200 text-gray-800' 
                                                                                : 'bg-yellow-200 text-yellow-900'
                                                                        }`}>
                                                                            {payment.late_charge.waived ? '✓ WAIVED' : 'ACTIVE'}
                                                                        </span>
                                                                    </div>
                                                                    
                                                                    {/* Charge Details */}
                                                                    <div className="bg-white rounded p-2 border border-yellow-200">
                                                                        <div className="space-y-1 text-xs">
                                                                            <div className="flex justify-between">
                                                                                <span className="font-medium text-gray-700">Charge Amount:</span>
                                                                                <span className="font-bold text-yellow-900">${parseFloat(payment.late_charge.charge_amount).toLocaleString()}</span>
                                                                            </div>
                                                                            <div className="flex justify-between">
                                                                                <span className="font-medium text-gray-700">Reason:</span>
                                                                                <span className="text-gray-900">{payment.late_charge.reason}</span>
                                                                            </div>
                                                                            {payment.late_charge.waived_reason && (
                                                                                <div className="flex justify-between pt-1 border-t border-yellow-200">
                                                                                    <span className="font-medium text-gray-700">Waived Reason:</span>
                                                                                    <span className="text-gray-900">{payment.late_charge.waived_reason}</span>
                                                                                </div>
                                                                            )}
                                                                            {payment.late_charge.admin_notes && (
                                                                                <div className="flex justify-between pt-1 border-t border-yellow-200">
                                                                                    <span className="font-medium text-gray-700">Admin Notes:</span>
                                                                                    <span className="text-gray-900">{payment.late_charge.admin_notes}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {/* Explanation */}
                                                                    <div className="bg-blue-50 rounded p-2 border border-blue-200">
                                                                        <p className="text-xs font-semibold text-blue-900 mb-1">💡 Why This Charge?</p>
                                                                        <p className="text-xs text-blue-800 leading-relaxed">
                                                                            This payment was due on <strong>{new Date(payment.due_date).toLocaleDateString()}</strong> but payment was not received. 
                                                                            After exceeding the payment due date by a certain number of days, our system automatically applied a late charge based on our configured late payment policy to encourage timely payment.
                                                                        </p>
                                                                    </div>
                                                                    
                                                                    {/* Status Breakdown */}
                                                                    <div className="grid grid-cols-3 gap-2">
                                                                        <div className="bg-white rounded p-2 border border-gray-200 text-center">
                                                                            <p className="text-xs text-gray-600">Due Amount</p>
                                                                            <p className="font-bold text-gray-900">${parseFloat(payment.amount_due).toLocaleString()}</p>
                                                                        </div>
                                                                        <div className={`rounded p-2 border text-center ${payment.late_charge.is_paid ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                                                                            <p className="text-xs text-gray-600">Charge Fee</p>
                                                                            <p className={`font-bold ${payment.late_charge.is_paid ? 'text-green-900' : 'text-yellow-900'}`}>
                                                                                ${parseFloat(payment.late_charge.charge_amount).toLocaleString()}
                                                                            </p>
                                                                        </div>
                                                                        <div className="bg-white rounded p-2 border border-gray-200 text-center">
                                                                            <p className="text-xs text-gray-600">Total Due Now</p>
                                                                            <p className="font-bold text-gray-900">
                                                                                ${(parseFloat(payment.amount_due) + parseFloat(payment.late_charge.charge_amount)).toLocaleString()}
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    {payment.late_charge.is_paid && (
                                                                        <div className="bg-green-50 rounded p-2 border border-green-200">
                                                                            <p className="text-xs font-semibold text-green-900">✓ Charge Paid</p>
                                                                            {payment.late_charge.paid_date && (
                                                                                <p className="text-xs text-green-800">Paid on: {new Date(payment.late_charge.paid_date).toLocaleDateString()}</p>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {payment.status !== 'PAID' && (
                                                            <div className="col-span-2 flex gap-3 pt-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const amt = prompt('Confirm amount received', payment.amount_due);
                                                                        if (!amt) return;
                                                                        const ok = confirm(`Mark payment ${payment.payment_number} as PAID for $${amt}?`);
                                                                        if (!ok) return;
                                                                        handlePaymentAction(payment.id, 'mark-paid', { amount: amt });
                                                                    }}
                                                                    className="inline-flex items-center gap-1 rounded-md bg-green-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50"
                                                                    disabled={paymentActionLoading}
                                                                >
                                                                    <CheckCircleIcon className="h-3 w-3" />
                                                                    Mark Paid
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const reason = prompt('Enter failure reason (optional)');
                                                                        const ok = confirm(`Mark payment ${payment.payment_number} as FAILED?`);
                                                                        if (!ok) return;
                                                                        handlePaymentAction(payment.id, 'mark-failed', { reason });
                                                                    }}
                                                                    className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50"
                                                                    disabled={paymentActionLoading}
                                                                >
                                                                    <XCircleIcon className="h-3 w-3" />
                                                                    Mark Failed
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-8">No payment history available</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column - Statistics */}
                <div className="space-y-6">
                    <div className="bg-white shadow rounded-lg px-6 py-4">
                        <h3 className="text-sm font-medium text-gray-500 mb-4">Claim Statistics</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Total Claims</span>
                                <span className="text-lg font-semibold text-gray-900">{statistics.total_claims}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Approved</span>
                                <span className="text-lg font-semibold text-green-600">{statistics.approved_claims}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Paid</span>
                                <span className="text-lg font-semibold text-indigo-600">{statistics.paid_claims}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Pending</span>
                                <span className="text-lg font-semibold text-yellow-600">{statistics.pending_claims}</span>
                            </div>
                            <div className="border-t pt-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Claimed</span>
                                    <p className="text-lg font-bold text-gray-900">${parseFloat(statistics.total_claimed_amount || 0).toLocaleString()}</p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Approved</span>
                                    <p className="text-lg font-bold text-green-700">${parseFloat(statistics.total_approved_claim_amount || 0).toLocaleString()}</p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Paid</span>
                                    <p className="text-lg font-bold text-indigo-700">${parseFloat(statistics.total_paid_claim_amount || 0).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white shadow rounded-lg px-6 py-4">
                        <h3 className="text-sm font-medium text-gray-500 mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => setIsClaimModalOpen(true)}
                                className="block w-full px-4 py-2 text-center text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                            >
                                File a Claim
                            </button>
                            <button
                                onClick={() => navigate('/policies')}
                                className="block w-full px-4 py-2 text-center text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md"
                            >
                                View All Policies
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* File Claim Modal */}
            <Modal
                isOpen={isClaimModalOpen}
                onClose={() => {
                    setIsClaimModalOpen(false);
                    setClaimFormData({
                        claim_number: '',
                        incident_date: '',
                        description: '',
                        claim_amount: ''
                    });
                }}
                title="File a New Claim"
            >
                <form onSubmit={handleClaimSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Claim Number</label>
                        <input
                            type="text"
                            value={claimFormData.claim_number}
                            onChange={(e) => setClaimFormData({ ...claimFormData, claim_number: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder={`CLM-${Math.floor(Math.random() * 100000)}`}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Incident Date</label>
                        <input
                            type="date"
                            required
                            value={claimFormData.incident_date}
                            onChange={(e) => setClaimFormData({ ...claimFormData, incident_date: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Claim Amount</label>
                        <input
                            type="number"
                            required
                            value={claimFormData.claim_amount}
                            onChange={(e) => setClaimFormData({ ...claimFormData, claim_amount: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            required
                            value={claimFormData.description}
                            onChange={(e) => setClaimFormData({ ...claimFormData, description: e.target.value })}
                            rows={4}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="Describe the incident..."
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setIsClaimModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                        >
                            Submit Claim
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );

    // Helper function to generate premium payment data for chart
    function generatePremiumData(policy) {
        const monthlyPremium = parseFloat(policy.premium_amount) / 12;
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months.map((month, idx) => ({
            month,
            amount: parseFloat(monthlyPremium.toFixed(2)),
            paid: idx < new Date().getMonth() // Mock paid status
        }));
    }

    // Handle claim form submission
    async function handleClaimSubmit(e) {
        e.preventDefault();
        try {
            await api.post('/claims/', {
                ...claimFormData,
                policy: id,
                claim_number: claimFormData.claim_number || `CLM-${Math.floor(Math.random() * 100000)}`,
                status: 'SUBMITTED'
            });
            setIsClaimModalOpen(false);
            setClaimFormData({
                claim_number: '',
                incident_date: '',
                description: '',
                claim_amount: ''
            });
            // Refresh policy details to show new claim
            fetchPolicyDetails();
            alert('Claim submitted successfully!');
        } catch (error) {
            console.error('Failed to submit claim', error);
            alert('Failed to submit claim. Please try again.');
        }
    }
};

export default PolicyDetails;
