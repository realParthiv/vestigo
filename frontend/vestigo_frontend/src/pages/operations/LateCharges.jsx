import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';
import { PencilIcon, TrashIcon, CheckCircleIcon, XCircleIcon, EyeIcon } from '@heroicons/react/24/outline';

const LateCharges = () => {
    const navigate = useNavigate();
    const [charges, setCharges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCharge, setSelectedCharge] = useState(null);
    const [actionType, setActionType] = useState(null); // 'waive', 'adjust', 'mark-paid'
    const [formData, setFormData] = useState({ reason: '', amount: '', notes: '' });
    const [actionLoading, setActionLoading] = useState(false);
    const [filterWaived, setFilterWaived] = useState('all'); // 'all', 'active', 'waived'
    const [filterPaid, setFilterPaid] = useState('all'); // 'all', 'paid', 'unpaid'

    useEffect(() => {
        fetchCharges();
    }, []);

    const fetchCharges = async () => {
        try {
            const response = await api.get('/operations/late-charges/');
            setCharges(response.data.results || response.data);
        } catch (err) {
            setError('Failed to load late charges');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const openActionModal = (charge, type) => {
        setSelectedCharge(charge);
        setActionType(type);
        setFormData({ reason: '', amount: '', notes: '' });
        setIsModalOpen(true);
    };

    const handleAction = async () => {
        if (!selectedCharge) return;

        setActionLoading(true);
        try {
            const payload = {};
            if (actionType === 'waive') {
                payload.reason = formData.reason;
            } else if (actionType === 'adjust') {
                payload.amount = parseFloat(formData.amount);
                payload.notes = formData.notes;
            }

            await api.post(`/operations/late-charges/${selectedCharge.id}/${actionType}/`, payload);
            alert(`Late charge ${actionType}ed successfully`);
            setIsModalOpen(false);
            await fetchCharges();
        } catch (err) {
            alert('Failed to perform action: ' + (err.response?.data?.detail || err.message));
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (chargeId) => {
        if (!confirm('Are you sure you want to delete this charge?')) return;

        try {
            await api.delete(`/operations/late-charges/${chargeId}/`);
            alert('Late charge deleted successfully');
            await fetchCharges();
        } catch (err) {
            alert('Failed to delete charge');
        }
    };

    const filteredCharges = charges.filter(charge => {
        if (filterWaived === 'waived' && !charge.waived) return false;
        if (filterWaived === 'active' && charge.waived) return false;
        if (filterPaid === 'paid' && !charge.is_paid) return false;
        if (filterPaid === 'unpaid' && charge.is_paid) return false;
        return true;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="px-4 py-4 sm:px-6 lg:px-8">
            <div>
                <h1 className="text-3xl font-bold leading-tight text-gray-900">
                    Applied Late Charges
                </h1>
                <p className="mt-2 text-sm text-gray-700">
                    Manage late charges applied to overdue premium payments
                </p>
            </div>

            {error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">{error}</p>
                </div>
            )}

            {/* Summary Statistics */}
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <span className="text-3xl">📊</span>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total Charges</dt>
                                    <dd className="text-2xl font-semibold text-gray-900">{charges.length}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <span className="text-3xl">⚠️</span>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Active (Unpaid)</dt>
                                    <dd className="text-2xl font-semibold text-yellow-600">
                                        {charges.filter(c => !c.waived && !c.is_paid).length}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <span className="text-3xl">✓</span>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Paid Charges</dt>
                                    <dd className="text-2xl font-semibold text-green-600">
                                        {charges.filter(c => c.is_paid).length}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <span className="text-3xl">💰</span>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total Amount</dt>
                                    <dd className="text-2xl font-semibold text-gray-900">
                                        ${charges.filter(c => !c.waived).reduce((sum, c) => sum + parseFloat(c.charge_amount), 0).toLocaleString()}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="mt-6 flex gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Waiver Status
                    </label>
                    <select
                        value={filterWaived}
                        onChange={(e) => setFilterWaived(e.target.value)}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    >
                        <option value="all">All</option>
                        <option value="active">Active (Not Waived)</option>
                        <option value="waived">Waived</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Status
                    </label>
                    <select
                        value={filterPaid}
                        onChange={(e) => setFilterPaid(e.target.value)}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    >
                        <option value="all">All</option>
                        <option value="paid">Paid</option>
                        <option value="unpaid">Unpaid</option>
                    </select>
                </div>

                <div className="flex-1 flex items-end">
                    <p className="text-sm text-gray-600">
                        Showing {filteredCharges.length} of {charges.length} charges
                    </p>
                </div>
            </div>

            {/* Charges Table */}
            <div className="mt-8 flex flex-col">
                <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 px-4 sm:px-6 lg:px-8">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                        Customer
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Policy Number
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Payment
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Charge Amount
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Status
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Due Date
                                    </th>
                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {filteredCharges.length > 0 ? (
                                    filteredCharges.map((charge) => (
                                        <tr 
                                            key={charge.id} 
                                            onClick={() => navigate(`/late-charges/${charge.id}`)}
                                            className="hover:bg-gray-50 cursor-pointer"
                                        >
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                                <div className="flex items-center">
                                                    <div>
                                                        <div className="font-medium text-gray-900">{charge.customer_name || 'N/A'}</div>
                                                        <div className="text-gray-500">{charge.customer_email || 'No email'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                <div className="font-medium text-gray-900">{charge.policy_number || 'N/A'}</div>
                                                <div className="text-gray-500">${parseFloat(charge.policy_premium || 0).toLocaleString()}</div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                                                <div className="font-medium">{charge.payment_number}</div>
                                                <div className="text-gray-500">${parseFloat(charge.payment_due_amount || 0).toLocaleString()}</div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                <div className="font-bold text-yellow-900">${parseFloat(charge.charge_amount).toLocaleString()}</div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                    charge.waived 
                                                        ? 'bg-gray-100 text-gray-800' 
                                                        : charge.is_paid 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {charge.waived ? 'Waived' : charge.is_paid ? 'Paid' : 'Unpaid'}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                {charge.payment_due_date ? new Date(charge.payment_due_date).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/late-charges/${charge.id}`);
                                                    }}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    <EyeIcon className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                                            No late charges found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Action Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`${actionType === 'waive' ? 'Waive' : actionType === 'adjust' ? 'Adjust' : 'Mark Paid'} Late Charge`}
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleAction();
                    }}
                    className="space-y-4"
                >
                    {selectedCharge && (
                        <div className="bg-gray-50 p-3 rounded text-sm mb-4">
                            <p className="text-gray-600">Payment: <span className="font-semibold">{selectedCharge.payment_number}</span></p>
                            <p className="text-gray-600">Charge: <span className="font-semibold">${parseFloat(selectedCharge.charge_amount).toLocaleString()}</span></p>
                        </div>
                    )}

                    {actionType === 'waive' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Reason for Waiver *
                            </label>
                            <textarea
                                required
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                rows="3"
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                placeholder="Explain why this charge is being waived"
                            />
                        </div>
                    )}

                    {actionType === 'adjust' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    New Amount *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                    placeholder="Enter new amount"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Admin Notes (Optional)
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows="2"
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                    placeholder="Reason for adjustment"
                                />
                            </div>
                        </>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={actionLoading}
                            className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {actionLoading ? 'Processing...' : `${actionType === 'waive' ? 'Waive' : actionType === 'adjust' ? 'Adjust' : 'Mark Paid'}`}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default LateCharges;
