import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';

const Policies = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [policies, setPolicies] = useState([]);
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        policy_number: '', customer: '', policy_type: 'HEALTH',
        start_date: '', end_date: '', premium_amount: '', status: 'ACTIVE'
    });

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    useEffect(() => {
        fetchPolicies();
        fetchLeads();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, typeFilter, statusFilter]);

    const fetchPolicies = async () => {
        try {
            const response = await api.get('/operations/policies/');
            // DRF returns array directly, but sometimes wrapped in object with 'results' key
            const policiesData = Array.isArray(response.data) ? response.data : (response.data.results || []);
            setPolicies(policiesData);
            console.log('Fetched policies:', policiesData);
        } catch (error) {
            console.error("Failed to fetch policies", error);
            setPolicies([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchLeads = async () => {
        try {
            const response = await api.get('/bdm/leads/');
            setLeads(response.data);
        } catch (error) {
            console.error("Failed to fetch leads", error);
        }
    };

    // Auto-open modal if action=create query param present
    useEffect(() => {
        if (searchParams.get('action') === 'create') {
            handleOpenModal();
            // Remove query param after opening modal
            setSearchParams({});
        }
    }, []);

    // Filter Logic - Robust Null Safety
    const filteredPolicies = policies.filter(policy => {
        const policyNum = policy.policy_number ? String(policy.policy_number).toLowerCase() : '';
        const customerName = policy.customer_name ? String(policy.customer_name).toLowerCase() : '';
        const search = searchTerm.toLowerCase();

        const matchesSearch =
            policyNum.includes(search) ||
            customerName.includes(search);

        const matchesType = typeFilter === 'ALL' || policy.policy_type === typeFilter;
        const matchesStatus = statusFilter === 'ALL' || policy.status === statusFilter;

        return matchesSearch && matchesType && matchesStatus;
    });

    // Calculate Paginated Data
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPolicies = filteredPolicies.slice(indexOfFirstItem, indexOfLastItem);

    const handleOpenModal = () => {
        setFormData({
            policy_number: `POL-${Math.floor(Math.random() * 100000)}`, // Auto-gen for convenience
            customer: leads.length > 0 ? leads[0].id : '',
            policy_type: 'HEALTH',
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
            premium_amount: '',
            status: 'ACTIVE'
        });
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/operations/policies/', formData);
            fetchPolicies();
            setIsModalOpen(false);
        } catch (error) {
            console.error("Failed to create policy", error);
            alert("Failed to create policy.");
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-base font-semibold leading-6 text-gray-900">Policies</h1>
                    <p className="mt-2 text-sm text-gray-700">A list of all active and expired policies.</p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    <button
                        type="button"
                        onClick={handleOpenModal}
                        className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        Create Policy
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="relative max-w-xs w-full">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                        type="text"
                        className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        placeholder="Search policies, customers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-4 w-full sm:w-auto">
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    >
                        <option value="ALL">All Types</option>
                        <option value="HEALTH">Health</option>
                        <option value="AUTO">Auto</option>
                        <option value="LIFE">Life</option>
                        <option value="HOME">Home</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="ACTIVE">Active</option>
                        <option value="EXPIRED">Expired</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>
            </div>

            <div className="mt-6 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead>
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Policy #</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Customer</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Premium</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Dates</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {currentPolicies.map((policy) => (
                                    <tr
                                        key={policy.id}
                                        onClick={() => navigate(`/policies/${policy.id}`)}
                                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-indigo-600 hover:text-indigo-800 sm:pl-0">
                                            {policy.policy_number}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{policy.customer_name}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{policy.policy_type}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${policy.status === 'ACTIVE' ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-red-50 text-red-700 ring-red-600/20'}`}>
                                                {policy.status}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">${policy.premium_amount}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{policy.start_date} to {policy.end_date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {currentPolicies.length === 0 && <div className="text-center py-10 text-gray-500">No policies found matching your filters.</div>}
                    </div>
                </div>
            </div>

            <Pagination
                currentPage={currentPage}
                totalCount={filteredPolicies.length}
                pageSize={itemsPerPage}
                onPageChange={setCurrentPage}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Policy">
                <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Policy Number</label>
                        <input type="text" name="policy_number" value={formData.policy_number} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Customer</label>
                        <select name="customer" value={formData.customer} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" required>
                            <option value="">Select Customer</option>
                            {leads.map(lead => (
                                <option key={lead.id} value={lead.id}>{lead.first_name} {lead.last_name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <select name="policy_type" value={formData.policy_type} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                            <option value="HEALTH">Health</option>
                            <option value="AUTO">Auto</option>
                            <option value="LIFE">Life</option>
                            <option value="HOME">Home</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Start Date</label>
                            <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">End Date</label>
                            <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Premium ($)</label>
                        <input type="number" name="premium_amount" value={formData.premium_amount} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" required />
                    </div>
                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                        <button type="submit" className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:col-start-2">Create</button>
                        <button type="button" className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0" onClick={() => setIsModalOpen(false)}>Cancel</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Policies;
