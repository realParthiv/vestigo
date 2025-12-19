import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    CheckCircleIcon, 
    XCircleIcon, 
    ExclamationTriangleIcon,
    ShieldCheckIcon,
    UserIcon,
    BuildingOfficeIcon,
    PhoneIcon,
    EnvelopeIcon,
    CurrencyDollarIcon,
    CalendarIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

const SubmissionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [additionalNotes, setAdditionalNotes] = useState('');

    useEffect(() => {
        fetchSubmission();
    }, [id]);

    const fetchSubmission = async () => {
        try {
            const response = await api.get(`/underwriting/submissions/${id}/`);
            setSubmission(response.data);
        } catch (error) {
            console.error("Failed to fetch submission", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action) => {
        const actionMessages = {
            'approve': 'approve and issue policy for',
            'reject': 'reject',
            'request-info': 'request more information for'
        };
        
        if (!confirm(`Are you sure you want to ${actionMessages[action]} this submission?`)) return;
        
        setActionLoading(true);
        try {
            const payload = additionalNotes ? { notes: additionalNotes } : {};
            await api.post(`/underwriting/submissions/${id}/${action}/`, payload);
            alert(`Submission ${action === 'request-info' ? 'info requested' : action + 'd'} successfully`);
            navigate('/underwriting');
        } catch (error) {
            console.error(`Failed to ${action}`, error);
            alert(`Action failed: ${error.response?.data?.detail || error.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const getRiskBadgeColor = (score) => {
        if (score < 30) return 'bg-green-100 text-green-800';
        if (score < 60) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    const getRiskIcon = (score) => {
        if (score < 30) return <CheckCircleIcon className="h-6 w-6 text-green-600" />;
        if (score < 60) return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />;
        return <XCircleIcon className="h-6 w-6 text-red-600" />;
    };

    const getStatusBadgeColor = (status) => {
        const colors = {
            'PENDING': 'bg-yellow-100 text-yellow-800',
            'APPROVED': 'bg-green-100 text-green-800',
            'REJECTED': 'bg-red-100 text-red-800',
            'MORE_INFO_REQUIRED': 'bg-blue-100 text-blue-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading submission details...</p>
                </div>
            </div>
        );
    }
    
    if (!submission) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <XCircleIcon className="h-12 w-12 text-red-500 mx-auto" />
                    <p className="mt-4 text-gray-900 font-semibold">Submission not found</p>
                    <button 
                        onClick={() => navigate('/underwriting')}
                        className="mt-4 text-indigo-600 hover:text-indigo-500"
                    >
                        Return to Queue
                    </button>
                </div>
            </div>
        );
    }


    return (
        <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Back Button */}
            <div className="mb-6">
                <button 
                    onClick={() => navigate('/underwriting')} 
                    className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Underwriting Queue
                </button>
            </div>

            {/* Header with Status and Actions */}
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center">
                        <ShieldCheckIcon className="h-10 w-10 text-indigo-600 mr-3" />
                        <div>
                            <h1 className="text-3xl font-bold leading-tight text-gray-900">
                                Submission SUB-{String(submission.id).padStart(3, '0')}
                            </h1>
                            <div className="mt-1 flex items-center gap-2">
                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeColor(submission.status)}`}>
                                    {submission.status.replace('_', ' ')}
                                </span>
                                <span className="text-sm text-gray-500">
                                    Submitted {formatDate(submission.created_date)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Action Buttons */}
                {submission.status === 'PENDING' && (
                    <div className="mt-4 flex flex-col sm:flex-row gap-3 md:ml-4 md:mt-0">
                        <button
                            type="button"
                            onClick={() => handleAction('reject')}
                            disabled={actionLoading}
                            className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <XCircleIcon className="h-5 w-5 mr-2" />
                            Reject Submission
                        </button>
                        <button
                            type="button"
                            onClick={() => handleAction('request-info')}
                            disabled={actionLoading}
                            className="inline-flex items-center justify-center rounded-md bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                            Request More Info
                        </button>
                        <button
                            type="button"
                            onClick={() => handleAction('approve')}
                            disabled={actionLoading}
                            className="inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <CheckCircleIcon className="h-5 w-5 mr-2" />
                            Approve & Issue Policy
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left Column - Main Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Risk Assessment Section */}
                    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                        <div className="px-6 py-5 border-b border-gray-200">
                            <div className="flex items-center">
                                <ShieldCheckIcon className="h-6 w-6 text-indigo-600 mr-2" />
                                <h3 className="text-lg font-semibold leading-6 text-gray-900">Risk Assessment</h3>
                            </div>
                        </div>
                        <div className="px-6 py-6">
                            <div className="flex items-start gap-6">
                                <div className="flex-shrink-0">
                                    {getRiskIcon(submission.risk_score || 0)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Risk Score</p>
                                            <p className="text-3xl font-bold text-gray-900">{submission.risk_score || 0}</p>
                                        </div>
                                        <span className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${getRiskBadgeColor(submission.risk_score || 0)}`}>
                                            {submission.risk_score < 30 ? 'Low Risk' : submission.risk_score < 60 ? 'Medium Risk' : 'High Risk'}
                                        </span>
                                    </div>
                                    
                                    {/* Risk Score Bar */}
                                    <div className="mt-4">
                                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                                            <span>Low</span>
                                            <span>Medium</span>
                                            <span>High</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div 
                                                className={`h-3 rounded-full transition-all ${
                                                    submission.risk_score < 30 ? 'bg-green-500' : 
                                                    submission.risk_score < 60 ? 'bg-yellow-500' : 
                                                    'bg-red-500'
                                                }`}
                                                style={{ width: `${Math.min(submission.risk_score || 0, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                        <p className="text-sm font-medium text-gray-900 mb-1">Recommendation</p>
                                        <p className="text-sm text-gray-700">{submission.risk_recommendation || 'Pending Review'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Opportunity Details */}
                    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                        <div className="px-6 py-5 border-b border-gray-200">
                            <div className="flex items-center">
                                <DocumentTextIcon className="h-6 w-6 text-indigo-600 mr-2" />
                                <h3 className="text-lg font-semibold leading-6 text-gray-900">Opportunity Information</h3>
                            </div>
                        </div>
                        <div className="border-t border-gray-200">
                            <dl className="divide-y divide-gray-200">
                                <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                                    <dt className="text-sm font-medium text-gray-600">Opportunity Name</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 font-semibold">
                                        {submission.opportunity_details?.name || 'N/A'}
                                    </dd>
                                </div>
                                <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 bg-gray-50">
                                    <dt className="text-sm font-medium text-gray-600 flex items-center">
                                        <CurrencyDollarIcon className="h-5 w-5 mr-1 text-gray-400" />
                                        Expected Premium
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 font-semibold text-green-700">
                                        {formatCurrency(submission.submitted_premium || submission.opportunity_details?.expected_revenue)}
                                    </dd>
                                </div>
                                <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                                    <dt className="text-sm font-medium text-gray-600">Win Probability</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className="bg-indigo-600 h-2 rounded-full" 
                                                    style={{ width: `${submission.opportunity_details?.probability || 0}%` }}
                                                />
                                            </div>
                                            <span className="font-semibold">{submission.opportunity_details?.probability || 0}%</span>
                                        </div>
                                    </dd>
                                </div>
                                <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 bg-gray-50">
                                    <dt className="text-sm font-medium text-gray-600">Stage</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                                        {submission.opportunity_details?.stage || 'N/A'}
                                    </dd>
                                </div>
                                <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                                    <dt className="text-sm font-medium text-gray-600 flex items-center">
                                        <CalendarIcon className="h-5 w-5 mr-1 text-gray-400" />
                                        Expected Close Date
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                                        {formatDate(submission.opportunity_details?.close_date)}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    {/* Notes Section */}
                    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                        <div className="px-6 py-5 border-b border-gray-200">
                            <h3 className="text-lg font-semibold leading-6 text-gray-900">Notes & Risk Factors</h3>
                        </div>
                        <div className="px-6 py-5">
                            {submission.notes ? (
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{submission.notes}</p>
                            ) : (
                                <p className="text-sm text-gray-500 italic">No notes or risk factors provided.</p>
                            )}
                        </div>
                    </div>

                    {/* Additional Notes for Actions */}
                    {submission.status === 'PENDING' && (
                        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                            <div className="px-6 py-5 border-b border-gray-200">
                                <h3 className="text-lg font-semibold leading-6 text-gray-900">Add Notes (Optional)</h3>
                                <p className="mt-1 text-sm text-gray-500">Add notes that will be included with your decision.</p>
                            </div>
                            <div className="px-6 py-5">
                                <textarea
                                    rows={4}
                                    value={additionalNotes}
                                    onChange={(e) => setAdditionalNotes(e.target.value)}
                                    className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    placeholder="Enter any additional notes about your decision..."
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column - Customer Info */}
                <div className="lg:col-span-1">
                    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl sticky top-6">
                        <div className="px-6 py-5 border-b border-gray-200">
                            <div className="flex items-center">
                                <UserIcon className="h-6 w-6 text-indigo-600 mr-2" />
                                <h3 className="text-lg font-semibold leading-6 text-gray-900">Customer Details</h3>
                            </div>
                        </div>
                        <div className="px-6 py-6 space-y-6">
                            <div>
                                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Customer Name</p>
                                <p className="text-base font-semibold text-gray-900">{submission.customer_name || 'N/A'}</p>
                            </div>
                            
                            {submission.opportunity_details?.lead_company && (
                                <div>
                                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1 flex items-center">
                                        <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                                        Company
                                    </p>
                                    <p className="text-base text-gray-900">{submission.opportunity_details.lead_company}</p>
                                </div>
                            )}

                            {submission.opportunity_details?.lead_email && (
                                <div>
                                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1 flex items-center">
                                        <EnvelopeIcon className="h-4 w-4 mr-1" />
                                        Email
                                    </p>
                                    <a 
                                        href={`mailto:${submission.opportunity_details.lead_email}`}
                                        className="text-sm text-indigo-600 hover:text-indigo-500 break-all"
                                    >
                                        {submission.opportunity_details.lead_email}
                                    </a>
                                </div>
                            )}

                            {submission.opportunity_details?.lead_phone && (
                                <div>
                                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1 flex items-center">
                                        <PhoneIcon className="h-4 w-4 mr-1" />
                                        Phone
                                    </p>
                                    <a 
                                        href={`tel:${submission.opportunity_details.lead_phone}`}
                                        className="text-sm text-indigo-600 hover:text-indigo-500"
                                    >
                                        {submission.opportunity_details.lead_phone}
                                    </a>
                                </div>
                            )}

                            <div className="pt-4 border-t border-gray-200">
                                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Assigned Underwriter</p>
                                <p className="text-sm text-gray-900">{submission.underwriter_name || 'Unassigned'}</p>
                            </div>

                            <div>
                                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Submission Date</p>
                                <p className="text-sm text-gray-900">{formatDate(submission.created_date)}</p>
                            </div>

                            {submission.updated_at && (
                                <div>
                                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Last Updated</p>
                                    <p className="text-sm text-gray-900">{formatDate(submission.updated_at)}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SubmissionDetail;
