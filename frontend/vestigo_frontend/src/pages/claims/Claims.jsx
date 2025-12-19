import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';

const Claims = () => {
    const navigate = useNavigate();
    const [claims, setClaims] = useState([]);
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [formData, setFormData] = useState({
        claim_number: '', policy: '', incident_date: '',
        description: '', claim_amount: '', status: 'SUBMITTED',
        attachments: null
    });

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    useEffect(() => {
        fetchClaims();
        fetchPolicies();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    const normalizeClaims = (data) => {
        if (Array.isArray(data?.results)) return data.results;
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.data)) return data.data; // Some APIs wrap payloads
        return [];
    };

    const fetchClaims = async () => {
        try {
            const response = await api.get('/claims/');
            setClaims(normalizeClaims(response.data));
        } catch (error) {
            console.error("Failed to fetch claims", error);
            setClaims([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchPolicies = async () => {
        try {
            const response = await api.get('/operations/policies/');
            setPolicies(response.data);
        } catch (error) {
            console.error("Failed to fetch policies", error);
        }
    };

    // Filter Logic - Robust Null Safety
    const safeClaims = Array.isArray(claims) ? claims : [];

    const filteredClaims = safeClaims.filter(claim => {
        const claimNum = claim.claim_number ? String(claim.claim_number).toLowerCase() : '';
        const policyNum = claim.policy_number ? String(claim.policy_number).toLowerCase() : '';
        const custName = claim.customer_name ? String(claim.customer_name).toLowerCase() : '';
        const search = searchTerm.toLowerCase();

        const matchesSearch =
            claimNum.includes(search) ||
            policyNum.includes(search) ||
            custName.includes(search);

        const matchesStatus = statusFilter === 'ALL' || claim.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Calculate Paginated Data
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentClaims = filteredClaims.slice(indexOfFirstItem, indexOfLastItem);

    const allowedOptions = {
        SUBMITTED: ['SUBMITTED', 'IN_REVIEW', 'REJECTED'],
        IN_REVIEW: ['IN_REVIEW', 'APPROVED', 'REJECTED'],
        APPROVED: ['APPROVED', 'PAID', 'REJECTED'],
        REJECTED: ['REJECTED'],
        PAID: ['PAID']
    };

    const fallbackOptions = ['SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'PAID'];

    const handleOpenModal = () => {
        setFormData({
            claim_number: `CLM-${Math.floor(Math.random() * 100000)}`,
            policy: policies.length > 0 ? policies[0].id : '',
            incident_date: new Date().toISOString().split('T')[0],
            description: '',
            claim_amount: '',
            status: 'SUBMITTED',
            attachments: null
        });
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            const formDataObj = new FormData();
            formDataObj.append('claim_number', formData.claim_number);
            formDataObj.append('policy', formData.policy);
            formDataObj.append('incident_date', formData.incident_date);
            formDataObj.append('description', formData.description);
            formDataObj.append('claim_amount', formData.claim_amount);
            formDataObj.append('status', formData.status);
            if (formData.attachments) {
                formDataObj.append('attachments', formData.attachments);
            }
            await api.post('/claims/', formDataObj, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchClaims();
            setIsModalOpen(false);
        } catch (error) {
            console.error("Failed to create claim", error);
            alert("Failed to create claim.");
        }
    };

    // Require user confirmation and notes on status changes
    const handleStatusChange = async (claim, status) => {
        setStatusUpdating(true);
        try {
            const payload = { status };
            const note = prompt('Provide a reason/note for this status change');
            if (!note) {
                alert('A note is required to change claim status.');
                setStatusUpdating(false);
                return;
            }
            payload.note = note;

            if (status === 'APPROVED') {
                const amount = prompt('Enter approved amount');
                if (!amount) {
                    setStatusUpdating(false);
                    return;
                }
                const ok = confirm(`Approve claim with amount $${amount}?`);
                if (!ok) { setStatusUpdating(false); return; }
                payload.approved_amount = amount;
            }

            if (status === 'PAID') {
                const paid = prompt('Enter paid amount');
                if (!paid) {
                    setStatusUpdating(false);
                    return;
                }
                const payoutDate = prompt('Enter payout date (YYYY-MM-DD) or leave blank for today');
                const ok = confirm(`Mark claim as PAID for $${paid}?`);
                if (!ok) { setStatusUpdating(false); return; }
                payload.paid_amount = paid;
                if (payoutDate) payload.payout_date = payoutDate;
            }

            await api.post(`/claims/${claim.id}/set-status/`, payload);
            fetchClaims();
        } catch (error) {
            console.error('Failed to update status', error);
            alert(error?.response?.data?.error || 'Status update failed.');
        } finally {
            setStatusUpdating(false);
        }
    };

    const handleChange = (e) => {
        if (e.target.name === 'attachments') {
            setFormData({ ...formData, attachments: e.target.files[0] });
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-base font-semibold leading-6 text-gray-900">Claims</h1>
                    <p className="mt-2 text-sm text-gray-700">A list of all claims.</p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    <button
                        type="button"
                        onClick={handleOpenModal}
                        className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        File Claim
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
                        placeholder="Search claims..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-full sm:w-auto">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="SUBMITTED">Submitted</option>
                        <option value="IN_REVIEW">In Review</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="PAID">Paid</option>
                    </select>
                </div>
            </div>

            <div className="mt-6 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead>
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Claim #</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Policy</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Customer</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Amount</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {currentClaims.map((claim) => (
                                    <tr 
                                        key={claim.id}
                                        className="hover:bg-gray-50 cursor-pointer"
                                        onClick={() => navigate(`/claims/${claim.id}`)}
                                    >
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                                            {claim.claim_number}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{claim.policy_number}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{claim.customer_name}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">${claim.claim_amount}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                                                    {claim.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{claim.incident_date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {currentClaims.length === 0 && <div className="text-center py-10 text-gray-500">No claims found matching your filters.</div>}
                    </div>
                </div>
            </div>

            <Pagination
                currentPage={currentPage}
                totalCount={filteredClaims.length}
                pageSize={itemsPerPage}
                onPageChange={setCurrentPage}
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="File New Claim">
                <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Claim Number</label>
                        <input type="text" name="claim_number" value={formData.claim_number} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Policy</label>
                        <select name="policy" value={formData.policy} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" required>
                            <option value="">Select Policy</option>
                            {policies.map(policy => (
                                <option key={policy.id} value={policy.id}>{policy.policy_number} - {policy.customer_name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Incident Date</label>
                        <input type="date" name="incident_date" value={formData.incident_date} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Claim Amount ($)</label>
                        <input type="number" name="claim_amount" value={formData.claim_amount} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Attachments (optional)</label>
                        <input type="file" name="attachments" onChange={handleChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                    </div>
                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                        <button type="submit" className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:col-start-2">Submit Claim</button>
                        <button type="button" className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0" onClick={() => setIsModalOpen(false)}>Cancel</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Claims;
