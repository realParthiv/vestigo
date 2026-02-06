import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';

const BrokerageReconciliationDashboard = () => {
    const [statements, setStatements] = useState([]);
    const [uploading, setUploading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchStatements();
    }, []);

    const fetchStatements = async () => {
        const response = await api.get('/reconciliation/brokerage-statements/');
        setStatements(response.data);
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name);
        setUploading(true);

        try {
            await api.post('/reconciliation/brokerage-statements/upload_csv/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchStatements();
            alert('Upload Successful');
        } catch (error) {
            console.error('Upload failed', error);
            alert('Upload Failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="px-4 py-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-base font-semibold leading-6 text-gray-900">Brokerage Reconciliation</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Upload insurer brokerage statements and match against booked policies.
                    </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    <label className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 cursor-pointer">
                        <ArrowUpTrayIcon className="h-5 w-5 inline-block -ml-1 mr-1" />
                        {uploading ? 'Uploading...' : 'Upload Brokerage Statement'}
                        <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} disabled={uploading} />
                    </label>
                </div>
            </div>

            <div className="rounded-md bg-blue-50 p-4 mt-4 mb-6">
                <p className="text-sm text-blue-700">
                    <strong>Expected CSV headers:</strong> Date, Policy Number, Premium, Brokerage %, Brokerage Amount, Reference
                </p>
            </div>

            <div className="mt-8 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead>
                                <tr>
                                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Name</th>
                                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Insurer</th>
                                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Uploaded</th>
                                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Matched</th>
                                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Variance</th>
                                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Unmatched</th>
                                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Approved</th>
                                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-0">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {statements.map((stmt) => (
                                    <tr key={stmt.id}>
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{stmt.name}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{stmt.insurer_name || '-'}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{new Date(stmt.uploaded_at).toLocaleDateString()}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-green-600 font-medium">{stmt.matched_count}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-amber-600 font-medium">{stmt.variance_count}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-red-600 font-medium">{stmt.unmatched_count}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-blue-600 font-medium">{stmt.approved_count}</td>
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                                            <button
                                                onClick={() => navigate(`/reconciliation/brokerage/${stmt.id}`)}
                                                className="text-indigo-600 hover:text-indigo-900"
                                            >
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BrokerageReconciliationDashboard;
