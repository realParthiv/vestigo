import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { PlusIcon, UserCircleIcon } from '@heroicons/react/20/solid';
import api from '../../services/api';

const STAGES = {
    DISCOVERY: 'Discovery',
    QUOTE: 'Quote Sent',
    NEGOTIATION: 'Negotiation',
    CLOSED_WON: 'Closed Won',
    CLOSED_LOST: 'Closed Lost'
};

const Opportunities = () => {
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOpportunities();
    }, []);

    const fetchOpportunities = async () => {
        try {
            const response = await api.get('/bdm/opportunities/');
            setOpportunities(response.data);
        } catch (error) {
            console.error("Failed to fetch opportunities", error);
        } finally {
            setLoading(false);
        }
    };

    const getStageColor = (stage) => {
        switch (stage) {
            case 'CLOSED_WON': return 'bg-green-50 border-green-200';
            case 'CLOSED_LOST': return 'bg-red-50 border-red-200';
            default: return 'bg-white border-gray-200 hover:border-indigo-300';
        }
    };

    const onDragEnd = async (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const newStage = destination.droppableId;
        const oppId = parseInt(draggableId);

        // Optimistic UI Update
        const updatedOpps = opportunities.map(opp => {
            if (opp.id === oppId) {
                return { ...opp, stage: newStage };
            }
            return opp;
        });
        setOpportunities(updatedOpps);

        // API Call
        try {
            await api.post(`/bdm/opportunities/${oppId}/move_stage/`, { stage: newStage });
        } catch (error) {
            console.error("Failed to move stage", error);
            // Revert on failure
            fetchOpportunities();
        }
    };

    const handleSubmitForUnderwriting = async (oppId) => {
        try {
            await api.post('/underwriting/submissions/', {
                opportunity: oppId,
                status: 'PENDING'
            });
            alert("Submitted for Underwriting!");
        } catch (error) {
            console.error("Failed to submit", error);
            alert("Submission failed. It might already be submitted.");
        }
    };

    if (loading) return <div>Loading...</div>;

    const groupedOpps = Object.keys(STAGES).reduce((acc, stageKey) => {
        acc[stageKey] = opportunities.filter(o => o.stage === stageKey);
        return acc;
    }, {});

    return (
        <div className="h-full flex flex-col px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center mb-6">
                <div className="sm:flex-auto">
                    <h1 className="text-base font-semibold leading-6 text-gray-900">Opportunities Board</h1>
                    <p className="mt-2 text-sm text-gray-700">Manage your deal pipeline.</p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    <button type="button" className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                        <PlusIcon className="h-5 w-5 inline-block -ml-1 mr-1" />
                        New Deal
                    </button>
                </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex overflow-x-auto gap-6 h-full pb-4">
                    {Object.entries(STAGES).map(([stageKey, stageLabel]) => (
                        <div key={stageKey} className="w-80 shrink-0 flex flex-col bg-gray-50/50 rounded-xl border border-gray-200">
                            <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-xl">
                                <span className="font-semibold text-sm text-gray-700 uppercase tracking-wide">
                                    {stageLabel}
                                </span>
                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
                                    {groupedOpps[stageKey].length}
                                </span>
                            </div>

                            <Droppable droppableId={stageKey}>
                                {(provided, snapshot) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className={`flex-1 overflow-y-auto p-3 space-y-3 min-h-[150px] transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-50/50' : ''
                                            }`}
                                    >
                                        {groupedOpps[stageKey].map((opp, index) => (
                                            <Draggable key={opp.id} draggableId={String(opp.id)} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={`p-4 rounded-lg border shadow-sm transition-all duration-200 group bg-white
                                                            ${getStageColor(opp.stage)} 
                                                            ${snapshot.isDragging ? 'shadow-xl rotate-2 scale-105 z-50 ring-2 ring-indigo-500 ring-opacity-50' : 'hover:shadow-md'}
                                                        `}
                                                        style={{ ...provided.draggableProps.style }}
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <div className="font-medium text-gray-900 line-clamp-2">{opp.name}</div>
                                                        </div>

                                                        <div className="text-xs text-gray-500 mt-1 font-medium">{opp.lead_company}</div>

                                                        <div className="mt-4 flex items-center justify-between">
                                                            <div className="text-sm font-bold text-gray-900">
                                                                {opp.expected_revenue ? `$${opp.expected_revenue.toLocaleString()}` : '-'}
                                                            </div>
                                                            {opp.assigned_to_name && (
                                                                <div className="flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                                                    <UserCircleIcon className="h-3 w-3 mr-1 text-gray-400" />
                                                                    {opp.assigned_to_name.split(' ').map(n => n[0]).join('')}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {(opp.expected_close_date || opp.stage === 'QUOTE') && (
                                                            <>
                                                                <div className="text-xs text-gray-400 mt-2 flex justify-between">
                                                                    <span>{opp.assigned_to_name || 'Unassigned'}</span>
                                                                    <span>{opp.expected_close_date || 'No Date'}</span>
                                                                </div>
                                                                {opp.stage === 'QUOTE' && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleSubmitForUnderwriting(opp.id);
                                                                        }}
                                                                        className="mt-3 w-full rounded bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-600 shadow-sm hover:bg-indigo-100"
                                                                    >
                                                                        Submit for Underwriting
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
};

export default Opportunities;
