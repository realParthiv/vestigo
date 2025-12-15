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
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(policy.status)}`}>
                        {policy.status}
                    </span>
                </div>
            </div>

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
                                        <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Payments</h4>
                                        {policyData.payments.slice(0, 6).map((payment) => {
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
                        <h3 className="text-sm font-medium text-gray-500 mb-4">Quick Statistics</h3>
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
                                <span className="text-sm text-gray-600">Pending</span>
                                <span className="text-lg font-semibold text-yellow-600">{statistics.pending_claims}</span>
                            </div>
                            <div className="border-t pt-4">
                                <span className="text-sm text-gray-600">Total Claimed</span>
                                <p className="text-xl font-bold text-gray-900 mt-1">${parseFloat(statistics.total_claimed_amount).toLocaleString()}</p>
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
            await api.post('/claims/claims/', {
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
