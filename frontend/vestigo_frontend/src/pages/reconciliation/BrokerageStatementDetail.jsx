import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';

const statusStyles = {
    MATCHED: 'bg-green-100 text-green-800',
    VARIANCE: 'bg-amber-100 text-amber-800',
    UNMATCHED: 'bg-red-100 text-red-800',
    APPROVED: 'bg-blue-100 text-blue-800',
    IGNORED: 'bg-gray-100 text-gray-800'
};

const BrokerageStatementDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [statement, setStatement] = useState(null);
    const [policyInput, setPolicyInput] = useState({});
    const [approvalNotes, setApprovalNotes] = useState({});

    useEffect(() => {
        fetchStatement();
    }, [id]);

    const fetchStatement = async () => {
        try {
            const response = await api.get(`/reconciliation/brokerage-statements/${id}/`);
            setStatement(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const runAutoMatch = async () => {
        try {
            const res = await api.post(`/reconciliation/brokerage-statements/${id}/auto_match/`);
            alert(`Auto-match complete. Found ${res.data.matches_found} matches.`);
            fetchStatement();
        } catch (e) { console.error(e); }
    };

    const handleManualMatch = async (lineId) => {
        const policyNumber = policyInput[lineId];
        if (!policyNumber) return alert('Enter Policy Number');
        try {
            await api.post(`/reconciliation/brokerage-lines/${lineId}/manual_match/`, { policy_number: policyNumber });
            fetchStatement();
        } catch (e) { alert('Match failed. Check Policy Number.'); }
    };

    const handleApprove = async (lineId) => {
        try {
            await api.post(`/reconciliation/brokerage-lines/${lineId}/approve/`, { approval_note: approvalNotes[lineId] || '' });
            fetchStatement();
        } catch (e) { alert('Approval failed'); }
    };

    if (!statement) return <div>Loading...</div>;

    return (
        <div className="px-4 py-4 sm:px-6 lg:px-8">
            <div className="mb-4 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">{statement.name}</h2>
                    <p className="text-sm text-gray-500">Insurer: {statement.insurer_name || 'N/A'}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => navigate('/reconciliation/brokerage')} className="text-sm text-gray-600">Back</button>
                    <button onClick={runAutoMatch} className="bg-indigo-600 text-white px-3 py-1 rounded">Run Auto Match</button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {statement.lines && statement.lines.length > 0 ? (
                    statement.lines.map(line => (
                        <div key={line.id} className={`p-4 rounded border ${line.status === 'VARIANCE' ? 'bg-amber-50 border-amber-200' : line.status === 'MATCHED' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                            <div className="flex justify-between">
                                <div>
                                    <p className="font-semibold text-gray-900">Policy: {line.policy_number || 'N/A'}</p>
                                    <p className="text-sm text-gray-500">Date: {line.date || '-'} | Ref: {line.reference || '-'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900">Brokerage: ₹{line.brokerage_amount ?? '-'}</p>
                                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusStyles[line.status] || 'bg-gray-100 text-gray-800'}`}>
                                        {line.status}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                                <div>Premium: ₹{line.premium_amount ?? '-'}</div>
                                <div>Rate: {line.brokerage_rate ?? '-'}%</div>
                                <div>Expected: ₹{line.expected_brokerage_amount ?? '-'}</div>
                            </div>

                            {line.variance_amount !== null && line.variance_amount !== undefined && line.variance_amount !== '0.00' && (
                                <div className={`mt-2 text-sm font-medium ${line.variance_amount > 0 ? 'text-red-700' : 'text-blue-700'}`}>
                                    Variance: ₹{line.variance_amount} {line.variance_amount > 0 ? '(Overpaid)' : '(Underpaid)'}
                                </div>
                            )}

                            <div className="mt-3 border-t pt-2 flex items-center justify-between gap-2">
                                {line.status === 'UNMATCHED' ? (
                                    <div className="flex gap-2 w-full">
                                        <input
                                            type="text"
                                            placeholder="Enter Policy Number to Match"
                                            className="text-sm border rounded px-2 py-1 flex-1"
                                            onChange={(e) => setPolicyInput({ ...policyInput, [line.id]: e.target.value })}
                                        />
                                        <button
                                            onClick={() => handleManualMatch(line.id)}
                                            className="bg-gray-800 text-white text-xs px-3 py-1 rounded"
                                        >
                                            Match
                                        </button>
                                    </div>
                                ) : line.status === 'VARIANCE' ? (
                                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                                        <input
                                            type="text"
                                            placeholder="Approval note (optional)"
                                            className="text-sm border rounded px-2 py-1 flex-1"
                                            onChange={(e) => setApprovalNotes({ ...approvalNotes, [line.id]: e.target.value })}
                                        />
                                        <button
                                            onClick={() => handleApprove(line.id)}
                                            className="bg-blue-600 text-white text-xs px-3 py-1 rounded"
                                        >
                                            Approve Variance
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-600">
                                        Matched to: <b>{line.matched_policy_details?.policy_number || 'N/A'}</b>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-gray-500 py-8">No lines to display</div>
                )}
            </div>
        </div>
    );
};

export default BrokerageStatementDetail;
