import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const SubmissionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);

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
        if (!confirm(`Are you sure you want to ${action} this submission?`)) return;
        try {
            await api.post(`/underwriting/submissions/${id}/${action}/`);
            alert(`Submission ${action}d successfully`);
            navigate('/underwriting');
        } catch (error) {
            console.error(`Failed to ${action}`, error);
            alert("Action failed.");
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!submission) return <div>Submission not found</div>;

    return (
        <div className="px-4 py-4 sm:px-6 lg:px-8">
            <div className="mb-6">
                <button onClick={() => navigate('/underwriting')} className="text-sm text-gray-500 hover:text-gray-700">
                    &larr; Back to Queue
                </button>
            </div>

            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Submission #{submission.id}
                    </h2>
                </div>
                <div className="mt-4 flex md:ml-4 md:mt-0">
                    {submission.status === 'PENDING' && (
                        <>
                            <button
                                type="button"
                                onClick={() => handleAction('reject')}
                                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                            >
                                Reject
                            </button>
                            <button
                                type="button"
                                onClick={() => handleAction('approve')}
                                className="ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                                Approve & Issue Policy
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">Applicant Information</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">Details from the Opportunity.</p>
                </div>
                <div className="border-t border-gray-200">
                    <dl>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Opportunity Name</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{submission.opportunity_details?.name}</dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Applicant Company</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{submission.opportunity_details?.lead_company}</dd>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Expected Premium</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">${submission.opportunity_details?.expected_revenue}</dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Current Status</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{submission.status}</dd>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Notes / Risk Factors</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                                {submission.notes || "No notes provided."}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>
        </div>
    );
}

export default SubmissionDetail;
