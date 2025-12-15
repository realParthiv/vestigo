import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const StatementDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [statement, setStatement] = useState(null);
    const [policyIdInput, setPolicyIdInput] = useState({});

    useEffect(() => {
        fetchStatement();
    }, [id]);

    const fetchStatement = async () => {
        try {
            const response = await api.get(`/reconciliation/statements/${id}/`);
            setStatement(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const runAutoMatch = async () => {
        try {
            const res = await api.post(`/reconciliation/statements/${id}/auto_match/`);
            alert(`Auto-match complete. Found ${res.data.matches_found} new matches.`);
            fetchStatement();
        } catch (e) { console.error(e); }
    };

    const handleManualMatch = async (lineId) => {
        const policyId = policyIdInput[lineId];
        if (!policyId) return alert("Enter Policy ID");
        try {
            await api.post(`/reconciliation/lines/${lineId}/manual_match/`, { policy_id: policyId });
            fetchStatement();
        } catch (e) { alert("Match failed. Check Policy ID."); }
    };

    const handleUnmatch = async (lineId) => {
        try {
            await api.post(`/reconciliation/lines/${lineId}/unmatch/`);
            fetchStatement();
        } catch (e) { alert("Unmatch failed"); }
    };

    if (!statement) return <div>Loading...</div>;

    return (
        <div className="px-4 py-4 sm:px-6 lg:px-8">
            <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">{statement.name}</h2>
                <button onClick={runAutoMatch} className="bg-indigo-600 text-white px-3 py-1 rounded">Run Auto Match</button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {statement.lines.map(line => (
                    <div key={line.id} className={`p-4 rounded border ${line.status === 'MATCHED' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                        <div className="flex justify-between">
                            <div>
                                <p className="font-semibold text-gray-900">{line.description}</p>
                                <p className="text-sm text-gray-500">{line.date} | Ref: {line.reference}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-gray-900">${line.amount}</p>
                                <span className={`text-xs px-2 py-0.5 rounded ${line.status === 'MATCHED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {line.status}
                                </span>
                            </div>
                        </div>

                        <div className="mt-3 border-t pt-2 flex items-center justify-between">
                            {line.status === 'MATCHED' ? (
                                <div className="text-sm text-green-700 w-full flex justify-between">
                                    <span>Matched to: <b>{line.matched_policy_details?.policy_number}</b></span>
                                    <button onClick={() => handleUnmatch(line.id)} className="text-xs text-red-600 hover:underline">Unmatch</button>
                                </div>
                            ) : (
                                <div className="flex gap-2 w-full">
                                    <input
                                        type="text"
                                        placeholder="Enter Policy ID to Match"
                                        className="text-sm border rounded px-2 py-1 flex-1"
                                        onChange={(e) => setPolicyIdInput({ ...policyIdInput, [line.id]: e.target.value })}
                                    />
                                    <button
                                        onClick={() => handleManualMatch(line.id)}
                                        className="bg-gray-800 text-white text-xs px-3 py-1 rounded"
                                    >
                                        Match
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StatementDetail;
