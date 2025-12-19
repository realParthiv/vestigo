import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';

const LateChargePolicies = () => {
    const navigate = useNavigate();
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        charge_type: 'PERCENTAGE',
        charge_amount: '',
        trigger_type: 'DAYS_OVERDUE',
        trigger_threshold: '',
        maximum_charge_per_payment: '',
        is_active: true
    });
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        fetchPolicies();
    }, []);

    const fetchPolicies = async () => {
        try {
            const response = await api.get('/operations/late-charge-policies/');
            setPolicies(response.data.results || response.data);
        } catch (err) {
            setError('Failed to load policies');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingPolicy(null);
        setFormData({
            name: '',
            description: '',
            charge_type: 'PERCENTAGE',
            charge_amount: '',
            trigger_type: 'DAYS_OVERDUE',
            trigger_threshold: '',
            maximum_charge_per_payment: '',
            is_active: true
        });
        setIsCreateModalOpen(true);
    };

    const handleOpenEdit = (policy) => {
        setEditingPolicy(policy);
        setFormData({
            name: policy.name,
            description: policy.description,
            charge_type: policy.charge_type,
            charge_amount: policy.charge_amount.toString(),
            trigger_type: policy.trigger_type,
            trigger_threshold: policy.trigger_threshold.toString(),
            maximum_charge_per_payment: policy.maximum_charge_per_payment ? policy.maximum_charge_per_payment.toString() : '',
            is_active: policy.is_active
        });
        setIsCreateModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const data = {
                ...formData,
                charge_amount: parseFloat(formData.charge_amount),
                trigger_threshold: parseInt(formData.trigger_threshold),
                maximum_charge_per_payment: formData.maximum_charge_per_payment ? parseFloat(formData.maximum_charge_per_payment) : null
            };

            if (editingPolicy) {
                await api.patch(`/operations/late-charge-policies/${editingPolicy.id}/`, data);
                alert('Policy updated successfully');
            } else {
                await api.post('/operations/late-charge-policies/', data);
                alert('Policy created successfully');
            }

            setIsCreateModalOpen(false);
            await fetchPolicies();
        } catch (err) {
            alert('Failed to save policy: ' + (err.response?.data?.detail || err.message));
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (policyId) => {
        if (!confirm('Are you sure you want to delete this policy?')) return;

        try {
            await api.delete(`/operations/late-charge-policies/${policyId}/`);
            alert('Policy deleted successfully');
            await fetchPolicies();
        } catch (err) {
            alert('Failed to delete policy');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="px-4 py-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold leading-tight text-gray-900">
                        Late Charge Policies
                    </h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Configure automatic late payment charges for overdue premiums
                    </p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    New Policy
                </button>
            </div>

            {error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">{error}</p>
                </div>
            )}

            <div className="mt-8 flex flex-col">
                <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 px-4 sm:px-6 lg:px-8">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                        Name
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Type
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Amount
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Trigger
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Status
                                    </th>
                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {policies.length > 0 ? (
                                    policies.map((policy) => (
                                        <tr key={policy.id}>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                                <div>
                                                    <p className="font-semibold">{policy.name}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{policy.description}</p>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                    policy.charge_type === 'PERCENTAGE' 
                                                        ? 'bg-blue-100 text-blue-800' 
                                                        : 'bg-green-100 text-green-800'
                                                }`}>
                                                    {policy.charge_type === 'PERCENTAGE' ? '%' : '$'} {policy.charge_type}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 font-semibold">
                                                {policy.charge_type === 'PERCENTAGE' 
                                                    ? `${parseFloat(policy.charge_amount)}%`
                                                    : `$${parseFloat(policy.charge_amount).toLocaleString()}`
                                                }
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                <span className="text-xs">
                                                    {policy.trigger_type === 'DAYS_OVERDUE' ? 'Days' : 'Months'} after {policy.trigger_threshold}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                    policy.is_active 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {policy.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                <button
                                                    onClick={() => handleOpenEdit(policy)}
                                                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                >
                                                    <PencilIcon className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(policy.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                                            No policies configured yet
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title={editingPolicy ? 'Edit Late Charge Policy' : 'Create Late Charge Policy'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Policy Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            placeholder="e.g., 2% Monthly Late Fee"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows="2"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            placeholder="Policy description"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Charge Type *
                            </label>
                            <select
                                value={formData.charge_type}
                                onChange={(e) => setFormData({ ...formData, charge_type: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            >
                                <option value="PERCENTAGE">Percentage (%)</option>
                                <option value="FLAT">Flat Fee ($)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                {formData.charge_type === 'PERCENTAGE' ? 'Percentage (%)' : 'Amount ($)'} *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={formData.charge_amount}
                                onChange={(e) => setFormData({ ...formData, charge_amount: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Trigger Type *
                            </label>
                            <select
                                value={formData.trigger_type}
                                onChange={(e) => setFormData({ ...formData, trigger_type: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            >
                                <option value="DAYS_OVERDUE">Days Overdue</option>
                                <option value="MONTHS_OVERDUE">Months Overdue</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Trigger Value ({formData.trigger_type === 'DAYS_OVERDUE' ? 'Days' : 'Months'}) *
                            </label>
                            <input
                                type="number"
                                required
                                value={formData.trigger_threshold}
                                onChange={(e) => setFormData({ ...formData, trigger_threshold: e.target.value })}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Maximum Charge Per Payment (Optional)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.maximum_charge_per_payment}
                            onChange={(e) => setFormData({ ...formData, maximum_charge_per_payment: e.target.value })}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            placeholder="e.g., 500"
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                        />
                        <label className="ml-2 block text-sm text-gray-900">
                            Active Policy
                        </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={formLoading}
                            className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {formLoading ? 'Saving...' : 'Save Policy'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
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

export default LateChargePolicies;
