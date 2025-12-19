import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';

const Leads = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);
    const [formData, setFormData] = useState({
        first_name: '', last_name: '', email: '',
        phone: '', company_name: '', source: 'Website', status: 'NEW'
    });

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    useEffect(() => {
        fetchLeads();
    }, []);

    useEffect(() => {
        if (selectedLead) {
            setFormData({
                first_name: selectedLead.first_name,
                last_name: selectedLead.last_name,
                email: selectedLead.email,
                phone: selectedLead.phone,
                company_name: selectedLead.company_name,
                source: selectedLead.source,
                status: selectedLead.status
            });
        } else {
            setFormData({
                first_name: '', last_name: '', email: '',
                phone: '', company_name: '', source: 'Website', status: 'NEW'
            });
        }
    }, [selectedLead]);

    useEffect(() => {
        // Reset to page 1 when filters change
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    const fetchLeads = async () => {
        try {
            const response = await api.get('/bdm/leads/');
            setLeads(response.data);
        } catch (error) {
            console.error("Failed to fetch leads", error);
        } finally {
            setLoading(false);
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
    const filteredLeads = leads.filter(lead => {
        // Safely extract and normalize fields
        const firstName = lead.first_name ? String(lead.first_name).toLowerCase() : '';
        const lastName = lead.last_name ? String(lead.last_name).toLowerCase() : '';
        const companyName = lead.company_name ? String(lead.company_name).toLowerCase() : '';
        const email = lead.email ? String(lead.email).toLowerCase() : '';
        const search = searchTerm.toLowerCase();

        const matchesSearch =
            firstName.includes(search) ||
            lastName.includes(search) ||
            companyName.includes(search) ||
            email.includes(search);

        const matchesStatus = statusFilter === 'ALL' || lead.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Calculate Paginated Data
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentLeads = filteredLeads.slice(indexOfFirstItem, indexOfLastItem);

    const handleOpenModal = (lead = null) => {
        setSelectedLead(lead);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setSelectedLead(null);
        setIsModalOpen(false);
        setFormData({
            first_name: '', last_name: '', email: '',
            phone: '', company_name: '', source: 'Website', status: 'NEW'
        });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedLead) {
                await api.put(`/bdm/leads/${selectedLead.id}/`, formData);
            } else {
                await api.post('/bdm/leads/', formData);
            }
            fetchLeads();
            handleCloseModal();
        } catch (error) {
            console.error("Failed to save lead", error);
            alert("Failed to save lead. Please check inputs.");
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleConvertToOpportunity = async (lead) => {
        const opportunityName = prompt("Enter opportunity name:", `${lead.first_name} ${lead.last_name} - Policy`);
        if (!opportunityName) return;

        try {
            const payload = {
                name: opportunityName,
                lead: lead.id,
                stage: 'DISCOVERY',
                expected_premium: 0,
                probability: 25,
                notes: `Converted from lead: ${lead.first_name} ${lead.last_name}`
            };
            
            await api.post('/bdm/opportunities/', payload);
            
            // Mark lead as CONVERTED
            await api.put(`/bdm/leads/${lead.id}/`, {
                ...lead,
                status: 'CONVERTED'
            });
            
            fetchLeads();
            alert("Lead converted to Opportunity! Go to Opportunities Board to manage it.");
        } catch (error) {
            console.error("Failed to convert lead", error);
            alert("Failed to convert lead. Please try again.");
        }
    };

    const handleDeleteLead = async (id) => {
        if (window.confirm("Are you sure you want to delete this lead?")) {
            try {
                await api.delete(`/bdm/leads/${id}/`);
                fetchLeads();
            } catch (error) {
                console.error("Failed to delete lead", error);
                alert("Failed to delete lead.");
            }
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-base font-semibold leading-6 text-gray-900">Leads</h1>
                    <p className="mt-2 text-sm text-gray-700">A list of all incoming leads.</p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    <button
                        type="button"
                        onClick={() => handleOpenModal()}
                        className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        Add User
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
                        placeholder="Search leads..."
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
                        <option value="NEW">New</option>
                        <option value="CONTACTED">Contacted</option>
                        <option value="QUALIFIED">Qualified</option>
                        <option value="LOST">Lost</option>
                        <option value="CONVERTED">Converted</option>
                    </select>
                </div>
            </div>

            <div className="mt-6 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead>
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Name</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Company</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Email</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                                        <span className="sr-only">Edit</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {currentLeads.map((lead) => (
                                    <tr key={lead.id}>
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                                            {lead.first_name} {lead.last_name}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{lead.company_name}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{lead.email}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${lead.status === 'NEW' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' : 'bg-gray-50 text-gray-600 ring-gray-600/20'}`}>
                                                {lead.status}
                                            </span>
                                        </td>
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                                            {lead.status !== 'CONVERTED' && (
                                                <button
                                                    onClick={() => handleConvertToOpportunity(lead)}
                                                    className="text-green-600 hover:text-green-900 mr-4"
                                                    title="Convert to Opportunity"
                                                >
                                                    Convert
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleOpenModal(lead)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteLead(lead.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete<span className="sr-only">, {lead.first_name}</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {currentLeads.length === 0 && <div className="text-center py-10 text-gray-500">No leads found matching your filters.</div>}
                    </div>
                </div>
            </div>

            <Pagination
                currentPage={currentPage}
                totalCount={filteredLeads.length}
                pageSize={itemsPerPage}
                onPageChange={setCurrentPage}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={selectedLead ? "Edit Lead" : "Add New Lead"}
            >
                <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="first_name" className="block text-sm font-medium leading-6 text-gray-900">First Name</label>
                            <input type="text" name="first_name" required value={formData.first_name} onChange={handleChange} className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                        </div>
                        <div>
                            <label htmlFor="last_name" className="block text-sm font-medium leading-6 text-gray-900">Last Name</label>
                            <input type="text" name="last_name" required value={formData.last_name} onChange={handleChange} className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">Email</label>
                        <input type="email" name="email" required value={formData.email} onChange={handleChange} className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                    </div>
                    <div>
                        <label htmlFor="company_name" className="block text-sm font-medium leading-6 text-gray-900">Company</label>
                        <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium leading-6 text-gray-900">Phone</label>
                        <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                    </div>
                    <div>
                        <label htmlFor="source" className="block text-sm font-medium leading-6 text-gray-900">Source</label>
                        <select name="source" value={formData.source} onChange={handleChange} className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6">
                            <option value="Website">Website</option>
                            <option value="Referral">Referral</option>
                            <option value="LinkedIn">LinkedIn</option>
                        </select>
                    </div>
                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button type="submit" className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto">
                            Save
                        </button>
                        <button type="button" className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto" onClick={handleCloseModal}>
                            Cancel
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Leads;
