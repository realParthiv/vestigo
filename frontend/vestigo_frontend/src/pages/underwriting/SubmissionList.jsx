import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/20/solid';

const SubmissionList = () => {
    const [submissions, setSubmissions] = useState([]);
    const [filteredSubmissions, setFilteredSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const navigate = useNavigate();

    useEffect(() => {
        fetchSubmissions();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [submissions, searchTerm, statusFilter]);

    const fetchSubmissions = async () => {
        try {
            const response = await api.get('/underwriting/submissions/');
            setSubmissions(response.data);
        } catch (error) {
            console.error("Failed to fetch submissions", error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...submissions];

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(sub =>
                sub.opportunity_details?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                sub.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                sub.id?.toString().includes(searchTerm)
            );
        }

        // Apply status filter
        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(sub => sub.status === statusFilter);
        }

        setFilteredSubmissions(filtered);
        setCurrentPage(1); // Reset to first page when filters change
    };

    const getRiskBadgeColor = (score) => {
        if (!score) return 'bg-gray-100 text-gray-800';
        if (score < 30) return 'bg-green-100 text-green-800';
        if (score < 60) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    const getStatusBadgeColor = (status) => {
        switch (status) {
            case 'APPROVED':
                return 'bg-green-50 text-green-700 ring-green-600/20';
            case 'REJECTED':
                return 'bg-red-50 text-red-700 ring-red-600/20';
            case 'MORE_INFO_REQUIRED':
                return 'bg-amber-50 text-amber-700 ring-amber-600/20';
            default:
                return 'bg-yellow-50 text-yellow-800 ring-yellow-600/20';
        }
    };

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredSubmissions.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading submissions...</div></div>;

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-bold leading-6 text-gray-900">Underwriting Queue</h1>
                    <p className="mt-2 text-sm text-gray-700">Review and approve pending risk submissions from the sales pipeline.</p>
                </div>
            </div>

            {/* User Guidance Banner */}
            <div className="rounded-md bg-blue-50 p-4 mt-6 border-l-4 border-blue-400">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-blue-700">
                            <strong>How it works:</strong> Click "Review" to see submission details. Approve to auto-create a Policy, Reject to decline, or Request Info for more details from BDM.
                        </p>
                    </div>
                </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
                {/* Search Input */}
                <div className="flex-1">
                    <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            placeholder="Search by submission ID, opportunity, or customer..."
                        />
                    </div>
                </div>

                {/* Status Filter */}
                <div className="sm:w-64">
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <FunnelIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="block w-full rounded-md border-0 py-2 pl-10 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="MORE_INFO_REQUIRED">More Info Required</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Results Count */}
            <div className="mt-4">
                <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{currentItems.length}</span> of <span className="font-medium">{filteredSubmissions.length}</span> submissions
                    {searchTerm && <span className="ml-2 text-indigo-600">(filtered)</span>}
                </p>
            </div>

            <div className="mt-6 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">ID</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Opportunity</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Customer</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Risk Score</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Premium</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Created</th>
                                        <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {currentItems.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-3 py-8 text-center text-sm text-gray-500">
                                                {searchTerm || statusFilter !== 'ALL' 
                                                    ? 'No submissions match your filters' 
                                                    : 'No submissions found'}
                                            </td>
                                        </tr>
                                    ) : (
                                        currentItems.map((submission) => (
                                            <tr key={submission.id} className="hover:bg-gray-50">
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                                                    SUB-{submission.id}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                                                    {submission.opportunity_details?.name || 'N/A'}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                                                    {submission.customer_name || 'N/A'}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRiskBadgeColor(submission.risk_score)}`}>
                                                        {submission.risk_score || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusBadgeColor(submission.status)}`}>
                                                        {submission.status.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                                                    ${Number(submission.submitted_premium || 0).toLocaleString()}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {submission.created_date ? new Date(submission.created_date).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                    <Link 
                                                        to={`/underwriting/${submission.id}`} 
                                                        className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500"
                                                    >
                                                        Review
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pagination Controls */}
            {filteredSubmissions.length > itemsPerPage && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to <span className="font-medium">{Math.min(indexOfLastItem, filteredSubmissions.length)}</span> of{' '}
                                <span className="font-medium">{filteredSubmissions.length}</span> results
                            </p>
                        </div>
                        <div>
                            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                <button
                                    onClick={() => paginate(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                                >
                                    <span className="sr-only">Previous</span>
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => paginate(i + 1)}
                                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === i + 1 ? 'bg-indigo-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600' : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    onClick={() => paginate(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                                >
                                    <span className="sr-only">Next</span>
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SubmissionList;
