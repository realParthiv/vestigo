import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon, CurrencyDollarIcon, DocumentTextIcon, UserIcon, PaperClipIcon } from '@heroicons/react/24/outline';

const ClaimDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [claim, setClaim] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionType, setActionType] = useState(null); // approve, reject, in_review, paid
    const [formData, setFormData] = useState({ note: '', approved_amount: '', paid_amount: '', payout_date: '' });

    const allowedTransitions = {
        SUBMITTED: ['IN_REVIEW', 'REJECTED'],
        IN_REVIEW: ['APPROVED', 'REJECTED'],
        APPROVED: ['PAID', 'REJECTED'],
        REJECTED: [],
        PAID: []
    };

    useEffect(() => {
        fetchClaim();
    }, [id]);

    const fetchClaim = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/claims/${id}/`);
            setClaim(response.data);
            setError(null);
        } catch (err) {
            console.error('Failed to load claim', err);
            setError('Failed to load claim');
        } finally {
            setLoading(false);
        }
    };

    const openAction = (type) => {
        setActionType(type);
        setFormData({ note: '', approved_amount: claim?.approved_amount || '', paid_amount: claim?.paid_amount || '', payout_date: '' });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setActionType(null);
        setFormData({ note: '', approved_amount: '', paid_amount: '', payout_date: '' });
    };

    const performAction = async (e) => {
        e.preventDefault();
        if (!actionType || !claim) return;
        setActionLoading(true);

        const payload = { status: actionType, note: formData.note };
        if (!payload.note) {
            alert('Note is required for audit.');
            setActionLoading(false);
            return;
        }

        if (actionType === 'APPROVED') {
            if (!formData.approved_amount) {
                alert('Approved amount is required.');
                setActionLoading(false);
                return;
            }
            payload.approved_amount = formData.approved_amount;
        }

        if (actionType === 'PAID') {
            if (!formData.paid_amount) {
                alert('Paid amount is required.');
                setActionLoading(false);
                return;
            }
            payload.paid_amount = formData.paid_amount;
            if (formData.payout_date) {
                payload.payout_date = formData.payout_date;
            }
        }

        try {
            await api.post(`/claims/${claim.id}/set-status/`, payload);
            await fetchClaim();
            closeModal();
        } catch (err) {
            console.error('Status update failed', err);
            alert(err?.response?.data?.error || 'Failed to update status');
        } finally {
            setActionLoading(false);
        }
    };

    const statusBadge = (status) => {
        const styles = {
            SUBMITTED: 'bg-blue-100 text-blue-800',
            IN_REVIEW: 'bg-amber-100 text-amber-800',
            APPROVED: 'bg-green-100 text-green-800',
            REJECTED: 'bg-red-100 text-red-800',
            PAID: 'bg-emerald-100 text-emerald-800'
        };
        return <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-800'}`}>{status.replace('_', ' ')}</span>;
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-40 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (error || !claim) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">{error || 'Claim not found'}</p>
                    <button onClick={() => navigate('/claims')} className="mt-3 text-red-700 hover:text-red-900 text-sm">Back to claims</button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <button onClick={() => navigate('/claims')} className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
                <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to Claims
            </button>

            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Claim {claim.claim_number}</h1>
                    <p className="text-sm text-gray-600">Incident: {claim.incident_date}</p>
                </div>
                <div className="flex items-center gap-3">
                    {statusBadge(claim.status)}
                    <div className="text-right">
                        <p className="text-xs text-gray-500">Claim Amount</p>
                        <p className="text-xl font-bold text-gray-900">${parseFloat(claim.claim_amount || 0).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Claim core info */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white shadow rounded-lg p-5">
                        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <DocumentTextIcon className="h-5 w-5 text-indigo-600" /> Claim Details
                        </h2>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">Claim Number</p>
                                <p className="font-medium text-gray-900">{claim.claim_number}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Status Note</p>
                                <p className="font-medium text-gray-900 whitespace-pre-wrap">{claim.status_note || '—'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Incident Date</p>
                                <p className="font-medium text-gray-900">{claim.incident_date}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Approved Amount</p>
                                <p className="font-medium text-gray-900">{claim.approved_amount ? `$${parseFloat(claim.approved_amount).toLocaleString()}` : '—'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Paid Amount</p>
                                <p className={`font-medium ${claim.paid_amount ? 'text-emerald-700' : 'text-gray-900'}`}>
                                    {claim.paid_amount ? `$${parseFloat(claim.paid_amount).toLocaleString()}` : '—'}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500">Payout Date</p>
                                <p className="font-medium text-gray-900">{claim.payout_date || '—'}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-gray-500">Description</p>
                                <p className="font-medium text-gray-900 whitespace-pre-wrap">{claim.description}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white shadow rounded-lg p-5">
                        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <CurrencyDollarIcon className="h-5 w-5 text-green-600" /> Financial Summary
                        </h2>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="bg-blue-50 border border-blue-100 rounded p-3 text-center">
                                <p className="text-xs text-blue-700">Claimed</p>
                                <p className="text-xl font-bold text-blue-900">${parseFloat(claim.claim_amount || 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-green-50 border border-green-100 rounded p-3 text-center">
                                <p className="text-xs text-green-700">Approved</p>
                                <p className="text-xl font-bold text-green-900">{claim.approved_amount ? `$${parseFloat(claim.approved_amount).toLocaleString()}` : '—'}</p>
                            </div>
                            <div className="bg-emerald-50 border border-emerald-100 rounded p-3 text-center">
                                <p className="text-xs text-emerald-700">Paid</p>
                                <p className="text-xl font-bold text-emerald-900">{claim.paid_amount ? `$${parseFloat(claim.paid_amount).toLocaleString()}` : '—'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white shadow rounded-lg p-5">
                        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <PaperClipIcon className="h-5 w-5 text-gray-600" /> Attachments
                        </h2>
                        {claim.attachments ? (
                            <a className="text-indigo-600 text-sm" href={claim.attachments} target="_blank" rel="noreferrer">View attachment</a>
                        ) : (
                            <p className="text-sm text-gray-600">No attachments uploaded.</p>
                        )}
                    </div>
                </div>

                {/* Side column */}
                <div className="space-y-4">
                    <div className="bg-white shadow rounded-lg p-5">
                        <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <DocumentTextIcon className="h-5 w-5 text-indigo-600" /> Policy
                        </h3>
                        <p className="text-sm text-gray-600">Policy Number</p>
                        <p className="font-medium text-gray-900">{claim.policy_number}</p>
                        <div className="mt-2">
                            <Link to={`/policies/${claim.policy}`} className="text-sm text-indigo-600 hover:text-indigo-800">View policy</Link>
                        </div>
                    </div>

                    <div className="bg-white shadow rounded-lg p-5">
                        <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <UserIcon className="h-5 w-5 text-indigo-600" /> Customer
                        </h3>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium text-gray-900">{claim.customer_name || '—'}</p>
                        <p className="text-sm text-gray-600 mt-2">Email</p>
                        <p className="font-medium text-gray-900">{claim.customer_email || '—'}</p>
                        <p className="text-sm text-gray-600 mt-2">Phone</p>
                        <p className="font-medium text-gray-900">{claim.customer_phone || '—'}</p>
                    </div>

                    <div className="bg-white shadow rounded-lg p-5">
                        <h3 className="text-md font-semibold text-gray-900 mb-3">Actions</h3>
                        <div className="flex flex-col gap-2">
                            {allowedTransitions[claim.status]?.includes('IN_REVIEW') && (
                                <button onClick={() => openAction('IN_REVIEW')} className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-500 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-600">
                                    <DocumentTextIcon className="h-4 w-4" /> Move to Review
                                </button>
                            )}
                            {allowedTransitions[claim.status]?.includes('APPROVED') && (
                                <button onClick={() => openAction('APPROVED')} className="inline-flex items-center justify-center gap-2 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700">
                                    <CheckCircleIcon className="h-4 w-4" /> Approve Claim
                                </button>
                            )}
                            {allowedTransitions[claim.status]?.includes('PAID') && (
                                <button onClick={() => openAction('PAID')} className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                                    <CurrencyDollarIcon className="h-4 w-4" /> Mark Paid
                                </button>
                            )}
                            {allowedTransitions[claim.status]?.includes('REJECTED') && (
                                <button onClick={() => openAction('REJECTED')} className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700">
                                    <XCircleIcon className="h-4 w-4" /> Reject Claim
                                </button>
                            )}
                            {(!allowedTransitions[claim.status] || allowedTransitions[claim.status].length === 0) && (
                                <p className="text-xs text-gray-500">No further actions available.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Modal */}
            <Modal isOpen={isModalOpen} onClose={closeModal}>
                <div className="p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Update Claim Status</h3>
                    <form onSubmit={performAction} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Note (required)</label>
                            <textarea
                                className="w-full rounded-md border-gray-300 text-sm"
                                rows="3"
                                value={formData.note}
                                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                required
                            />
                        </div>

                        {actionType === 'APPROVED' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Approved Amount</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full rounded-md border-gray-300 text-sm"
                                    value={formData.approved_amount}
                                    onChange={(e) => setFormData({ ...formData, approved_amount: e.target.value })}
                                    required
                                />
                            </div>
                        )}

                        {actionType === 'PAID' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full rounded-md border-gray-300 text-sm"
                                        value={formData.paid_amount}
                                        onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Payout Date (optional)</label>
                                    <input
                                        type="date"
                                        className="w-full rounded-md border-gray-300 text-sm"
                                        value={formData.payout_date}
                                        onChange={(e) => setFormData({ ...formData, payout_date: e.target.value })}
                                    />
                                </div>
                            </>
                        )}

                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700">Cancel</button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50"
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Saving...' : 'Confirm'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
};

export default ClaimDetail;
