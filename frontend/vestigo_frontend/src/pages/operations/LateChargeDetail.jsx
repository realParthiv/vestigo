import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';
import { 
    ArrowLeftIcon, 
    CheckCircleIcon, 
    XCircleIcon, 
    PencilIcon,
    TrashIcon
} from '@heroicons/react/24/outline';

const LateChargeDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [charge, setCharge] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionType, setActionType] = useState(null);
    const [formData, setFormData] = useState({ reason: '', amount: '', notes: '' });
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchChargeDetail();
    }, [id]);

    const fetchChargeDetail = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/operations/late-charges/${id}/`);
            setCharge(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to load late charge details');
            console.error('Error fetching charge:', err);
        } finally {
            setLoading(false);
        }
    };

    const openActionModal = (type) => {
        setActionType(type);
        setFormData({ reason: '', amount: charge?.charge_amount || '', notes: '' });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setActionType(null);
        setFormData({ reason: '', amount: '', notes: '' });
    };

    const handleAction = async (e) => {
        e.preventDefault();
        setActionLoading(true);

        try {
            let endpoint = '';
            let payload = {};

            switch (actionType) {
                case 'waive':
                    endpoint = `/operations/late-charges/${charge.id}/waive/`;
                    payload = { reason: formData.reason };
                    break;
                case 'adjust':
                    endpoint = `/operations/late-charges/${charge.id}/adjust/`;
                    payload = { new_amount: formData.amount, notes: formData.notes };
                    break;
                case 'mark-paid':
                    endpoint = `/operations/late-charges/${charge.id}/mark_paid/`;
                    payload = { notes: formData.notes };
                    break;
                default:
                    return;
            }

            await api.post(endpoint, payload);
            await fetchChargeDetail();
            closeModal();
        } catch (err) {
            console.error('Error performing action:', err);
            alert('Failed to perform action. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this late charge?')) {
            return;
        }

        try {
            await api.delete(`/operations/late-charges/${charge.id}/`);
            navigate('/late-charges');
        } catch (err) {
            console.error('Error deleting charge:', err);
            alert('Failed to delete late charge');
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !charge) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">{error || 'Late charge not found'}</p>
                    <button
                        onClick={() => navigate('/late-charges')}
                        className="mt-4 text-red-600 hover:text-red-800 font-medium"
                    >
                        ← Back to Late Charges
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate('/late-charges')}
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeftIcon className="h-5 w-5" />
                    Back to Late Charges
                </button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Late Charge Details</h1>
                        <p className="text-gray-500 mt-1">Charge ID: #{charge.id}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-bold ${
                            charge.waived 
                                ? 'bg-gray-200 text-gray-800' 
                                : charge.is_paid 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                        }`}>
                            {charge.waived ? '✓ WAIVED' : charge.is_paid ? '✓ PAID' : '⚠ UNPAID'}
                        </span>
                        <span className="text-3xl font-bold text-yellow-900">
                            ${parseFloat(charge.charge_amount).toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        👤 Customer Information
                    </h2>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Name</p>
                            <p className="text-lg font-medium text-gray-900">{charge.customer_name || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Email</p>
                            <p className="text-gray-900">{charge.customer_email || 'No email provided'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Phone</p>
                            <p className="text-gray-900">{charge.customer_phone || 'No phone provided'}</p>
                        </div>
                    </div>
                </div>

                {/* Policy Information */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        📋 Policy Information
                    </h2>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Policy Number</p>
                            <p className="text-lg font-medium text-gray-900">{charge.policy_number || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Premium Amount</p>
                            <p className="text-gray-900">${parseFloat(charge.policy_premium || 0).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Status</p>
                            <p className="text-gray-900">{charge.policy_status || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* Payment Information */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        💳 Payment Information
                    </h2>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Payment Number</p>
                            <p className="text-lg font-medium text-gray-900">{charge.payment_number}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Due Amount</p>
                            <p className="text-gray-900">${parseFloat(charge.payment_due_amount || 0).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Due Date</p>
                            <p className="text-gray-900">
                                {charge.payment_due_date ? new Date(charge.payment_due_date).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Payment Status</p>
                            <p className="text-gray-900">{charge.payment_status || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* Charge Details */}
                <div className="bg-yellow-50 border border-yellow-200 shadow rounded-lg p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        ⚠️ Charge Details
                    </h2>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Charge Amount</p>
                            <p className="text-2xl font-bold text-yellow-900">${parseFloat(charge.charge_amount).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Reason</p>
                            <p className="text-gray-900">{charge.reason}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Applied Policy</p>
                            <p className="text-gray-900">{charge.policy_applied || 'Manual Charge'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">Created Date</p>
                            <p className="text-gray-900">
                                {charge.created_at ? new Date(charge.created_at).toLocaleString() : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Amount Breakdown */}
            <div className="mt-6 bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">💰 Amount Breakdown</h2>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                        <p className="text-sm text-gray-600 mb-2">Original Due Amount</p>
                        <p className="text-2xl font-bold text-gray-900">${parseFloat(charge.payment_due_amount || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4 text-center border border-yellow-200">
                        <p className="text-sm text-gray-600 mb-2">Late Charge</p>
                        <p className="text-2xl font-bold text-yellow-900">+${parseFloat(charge.charge_amount).toLocaleString()}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
                        <p className="text-sm text-gray-600 mb-2">Total Amount Due</p>
                        <p className="text-2xl font-bold text-red-900">
                            ${(parseFloat(charge.payment_due_amount || 0) + parseFloat(charge.charge_amount)).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Waiver/Admin Information */}
            {(charge.waived || charge.admin_notes) && (
                <div className="mt-6 bg-gray-50 border border-gray-200 shadow rounded-lg p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">📝 Administrative Information</h2>
                    <div className="space-y-4">
                        {charge.waived && (
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Waiver Information</p>
                                <p className="text-gray-900">
                                    <strong>Reason:</strong> {charge.waived_reason || 'No reason provided'}
                                </p>
                                {charge.waived_date && (
                                    <p className="text-sm text-gray-600 mt-1">
                                        Waived on: {new Date(charge.waived_date).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        )}
                        {charge.admin_notes && (
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Admin Notes</p>
                                <p className="text-gray-900">{charge.admin_notes}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">⚙️ Actions</h2>
                <div className="flex flex-wrap gap-3">
                    {!charge.waived && !charge.is_paid && (
                        <>
                            <button
                                onClick={() => openActionModal('mark-paid')}
                                className="inline-flex items-center gap-2 rounded-md bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700"
                            >
                                <CheckCircleIcon className="h-5 w-5" />
                                Mark as Paid
                            </button>
                            <button
                                onClick={() => openActionModal('adjust')}
                                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                            >
                                <PencilIcon className="h-5 w-5" />
                                Adjust Amount
                            </button>
                            <button
                                onClick={() => openActionModal('waive')}
                                className="inline-flex items-center gap-2 rounded-md bg-orange-600 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-700"
                            >
                                <XCircleIcon className="h-5 w-5" />
                                Waive Charge
                            </button>
                        </>
                    )}
                    <button
                        onClick={handleDelete}
                        className="inline-flex items-center gap-2 rounded-md border border-red-300 bg-white px-6 py-3 text-sm font-semibold text-red-700 hover:bg-red-50"
                    >
                        <TrashIcon className="h-5 w-5" />
                        Delete Charge
                    </button>
                </div>
            </div>

            {/* Action Modal */}
            <Modal isOpen={isModalOpen} onClose={closeModal}>
                <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        {actionType === 'waive' && 'Waive Late Charge'}
                        {actionType === 'adjust' && 'Adjust Charge Amount'}
                        {actionType === 'mark-paid' && 'Mark Charge as Paid'}
                    </h3>
                    <form onSubmit={handleAction}>
                        {actionType === 'waive' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Waiver Reason *
                                </label>
                                <textarea
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    rows="3"
                                    required
                                />
                            </div>
                        )}
                        {actionType === 'adjust' && (
                            <>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        New Amount *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Notes
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        rows="2"
                                    />
                                </div>
                            </>
                        )}
                        {actionType === 'mark-paid' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    rows="2"
                                />
                            </div>
                        )}
                        <div className="flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                disabled={actionLoading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Processing...' : 'Confirm'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
};

export default LateChargeDetail;
