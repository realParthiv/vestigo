import { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { PlusIcon, TrashIcon, PencilIcon, ArrowRightIcon } from '@heroicons/react/20/solid';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';

const STAGES = {
    DISCOVERY: 'Discovery',
    QUOTE: 'Quote Sent',
    NEGOTIATION: 'Negotiation',
    CLOSED_WON: 'Closed Won',
    CLOSED_LOST: 'Closed Lost'
};

const STAGE_COLORS = {
    DISCOVERY: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-800' },
    QUOTE: { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-800' },
    NEGOTIATION: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-800' },
    CLOSED_WON: { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-800' },
    CLOSED_LOST: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-800' }
};

const Opportunities = () => {
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOpp, setSelectedOpp] = useState(null);
    const [formData, setFormData] = useState({
        name: '', stage: 'DISCOVERY', expected_revenue: 0, probability: 25, notes: ''
    });
    const boardRef = useRef(null);
    const scrollIntervalRef = useRef(null);

    useEffect(() => {
        fetchOpportunities();
    }, []);

    useEffect(() => {
        if (selectedOpp) {
            setFormData({
                lead: selectedOpp.lead,
                name: selectedOpp.name || '',
                stage: selectedOpp.stage || 'DISCOVERY',
                expected_revenue: selectedOpp.expected_revenue || 0,
                probability: selectedOpp.probability || 25,
                notes: selectedOpp.notes || ''
            });
        } else {
            setFormData({ name: '', stage: 'DISCOVERY', expected_revenue: 0, probability: 25, notes: '' });
        }
    }, [selectedOpp]);

    const fetchOpportunities = async () => {
        try {
            const response = await api.get('/bdm/opportunities/');
            console.log("Fetched opportunities:", response.data);
            setOpportunities(response.data);
        } catch (error) {
            console.error("Failed to fetch opportunities", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (opp = null) => {
        setSelectedOpp(opp);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setSelectedOpp(null);
        setIsModalOpen(false);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedOpp) {
                await api.put(`/bdm/opportunities/${selectedOpp.id}/`, formData);
            } else {
                await api.post('/bdm/opportunities/', formData);
            }
            fetchOpportunities();
            handleCloseModal();
        } catch (error) {
            console.error("Failed to save opportunity", error);
            alert("Failed to save opportunity. Please check inputs.");
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleDeleteOpp = async (id) => {
        if (window.confirm("Are you sure you want to delete this opportunity?")) {
            try {
                await api.delete(`/bdm/opportunities/${id}/`);
                fetchOpportunities();
            } catch (error) {
                console.error("Failed to delete opportunity", error);
                alert("Failed to delete opportunity.");
            }
        }
    };

    const onDragEnd = async (result) => {
        // Clear any active scroll interval
        if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
        }

        const { destination, source, draggableId } = result;

        // If no destination, do nothing
        if (!destination) {
            return;
        }

        // If dropped in same place, do nothing
        if (destination.droppableId === source.droppableId && destination.index === source.index) {
            return;
        }

        const newStage = destination.droppableId;
        const oppId = parseInt(draggableId);

        console.log("Moving opp", oppId, "to stage", newStage);

        try {
            // Use the custom move_stage action endpoint
            const response = await api.post(`/bdm/opportunities/${oppId}/move_stage/`, { stage: newStage });
            console.log("Move stage API response:", response.data);
            console.log("Update successful, fetching fresh data");
            // Fetch fresh data after successful update
            await fetchOpportunities();
            console.log("Opportunities state after fetch:", opportunities.length, "items");
        } catch (error) {
            console.error("Failed to update opportunity:", error);
            alert("Failed to move opportunity. Please try again.");
        }
    };

    const onDragUpdate = (update) => {
        if (!update.destination) {
            // Clear scroll if dragging outside droppable area
            if (scrollIntervalRef.current) {
                clearInterval(scrollIntervalRef.current);
                scrollIntervalRef.current = null;
            }
            return;
        }

        const board = boardRef.current;
        if (!board) return;

        // Get the bounding rectangle of the board
        const boardRect = board.getBoundingClientRect();
        
        // Get current mouse/pointer position (approximate from the draggable)
        const draggableElement = document.querySelector(`[data-rbd-draggable-id="${update.draggableId}"]`);
        if (!draggableElement) return;

        const draggableRect = draggableElement.getBoundingClientRect();
        const dragX = draggableRect.left + draggableRect.width / 2;

        // Define edge detection zone (pixels from edge)
        const edgeZone = 100;
        const scrollSpeed = 10;

        // Check if near left edge
        if (dragX < boardRect.left + edgeZone) {
            if (!scrollIntervalRef.current) {
                scrollIntervalRef.current = setInterval(() => {
                    if (board.scrollLeft > 0) {
                        board.scrollLeft -= scrollSpeed;
                    }
                }, 16); // ~60fps
            }
        }
        // Check if near right edge
        else if (dragX > boardRect.right - edgeZone) {
            if (!scrollIntervalRef.current) {
                scrollIntervalRef.current = setInterval(() => {
                    if (board.scrollLeft < board.scrollWidth - board.clientWidth) {
                        board.scrollLeft += scrollSpeed;
                    }
                }, 16); // ~60fps
            }
        }
        // Not near edges, clear scroll
        else {
            if (scrollIntervalRef.current) {
                clearInterval(scrollIntervalRef.current);
                scrollIntervalRef.current = null;
            }
        }
    };

    const handleSubmitForUnderwriting = async (oppId) => {
        try {
            await api.post('/underwriting/submissions/', {
                opportunity: oppId,
                status: 'PENDING'
            });
            alert("Submitted for Underwriting!");
            fetchOpportunities();
        } catch (error) {
            console.error("Failed to submit", error);
            alert("Submission failed. It might already be submitted.");
        }
    };

    if (loading) return <div className="p-8 text-center">Loading opportunities...</div>;

    const groupedOpps = Object.keys(STAGES).reduce((acc, stageKey) => {
        acc[stageKey] = opportunities.filter(o => o.stage === stageKey);
        return acc;
    }, {});

    const totalOpportunities = opportunities.length;
    const totalRevenue = opportunities.reduce((sum, opp) => sum + (parseFloat(opp.expected_revenue) || 0), 0);
    const weightedValue = opportunities.reduce((sum, opp) => sum + ((parseFloat(opp.expected_revenue) || 0) * (parseInt(opp.probability) || 0) / 100), 0);

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="px-6 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Sales Pipeline</h1>
                            <p className="mt-1 text-sm text-gray-600">Manage your opportunity pipeline with drag-and-drop</p>
                        </div>
                        <button
                            onClick={() => handleOpenModal()}
                            className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-indigo-500 transition-colors"
                        >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            New Deal
                        </button>
                    </div>

                    {/* Quick Stats */}
                    <div className="mt-6 grid grid-cols-3 gap-4">
                        <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Total Deals</p>
                            <p className="mt-2 text-2xl font-bold text-indigo-900">{totalOpportunities}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                            <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Total Pipeline Value</p>
                            <p className="mt-2 text-2xl font-bold text-green-900">${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Weighted Value (Probability)</p>
                            <p className="mt-2 text-2xl font-bold text-purple-900">${weightedValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Kanban Board */}
            <div ref={boardRef} className="flex-1 overflow-x-auto bg-gradient-to-br from-gray-50 to-gray-100">
                <DragDropContext onDragEnd={onDragEnd} onDragUpdate={onDragUpdate}>
                    <div className="flex gap-4 p-4 h-fit min-w-min">
                        {Object.entries(STAGES).map(([stageKey, stageLabel]) => {
                            const stageOpps = groupedOpps[stageKey];
                            const colors = STAGE_COLORS[stageKey];
                            return (
                                <div
                                    key={stageKey}
                                    data-stage={stageKey}
                                    className={`w-72 shrink-0 flex flex-col rounded-lg border-2 ${colors.border} bg-white shadow-md`}
                                >
                                    {/* Column Header */}
                                    <div className={`${colors.bg} px-3 py-2 rounded-t-lg border-b-2 ${colors.border} flex justify-between items-center`}>
                                        <h3 className="font-bold text-sm text-gray-900">{stageLabel}</h3>
                                        <span className={`${colors.badge} px-2 py-0.5 rounded-full text-xs font-bold`}>
                                            {stageOpps.length}
                                        </span>
                                    </div>

                                    {/* Cards Container */}
                                    <Droppable droppableId={stageKey}>
                                        {(provided, snapshot) => (
                                            <div
                                                {...provided.droppableProps}
                                                ref={provided.innerRef}
                                                className={`flex-1 p-3 space-y-2 min-h-[300px] overflow-y-auto transition-all ${
                                                    snapshot.isDraggingOver ? 'bg-indigo-50/30' : 'bg-white'
                                                }`}
                                            >
                                                {stageOpps.length === 0 ? (
                                                    <div className="text-center py-8 text-gray-400">
                                                        <p className="text-xs">No deals yet</p>
                                                    </div>
                                                ) : (
                                                    stageOpps.map((opp, index) => (
                                                        <Draggable key={opp.id} draggableId={String(opp.id)} index={index}>
                                                            {(provided, snapshot) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    className={`${colors.bg} p-3 rounded-md border-2 ${colors.border} transition-all duration-150 group cursor-move
                                                                        ${snapshot.isDragging ? `shadow-2xl ring-2 ${colors.badge} scale-105 rotate-1` : 'shadow-sm hover:shadow-md'}
                                                                    `}
                                                                >
                                                                    {/* Deal Name */}
                                                                    <div className="flex justify-between items-start mb-2 gap-1">
                                                                        <h4 className="font-bold text-gray-900 text-xs line-clamp-2 flex-1">{opp.name}</h4>
                                                                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <button
                                                                                onClick={() => handleOpenModal(opp)}
                                                                                className="p-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                                                                                title="Edit"
                                                                            >
                                                                                <PencilIcon className="h-3 w-3" />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDeleteOpp(opp.id)}
                                                                                className="p-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                                                                                title="Delete"
                                                                            >
                                                                                <TrashIcon className="h-3 w-3" />
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    {/* Premium Amount */}
                                                                    <div className="bg-white rounded px-2 py-1.5 mb-2 border border-gray-200">
                                                                        <p className="text-xs text-gray-600 font-medium">Premium</p>
                                                                        <p className="text-sm font-bold text-gray-900">
                                                                            ${(opp.expected_revenue || 0).toLocaleString()}
                                                                        </p>
                                                                    </div>

                                                                    {/* Probability */}
                                                                    <div className="mb-2">
                                                                        <div className="flex justify-between items-center mb-0.5">
                                                                            <p className="text-xs text-gray-700 font-semibold">Probability</p>
                                                                            <p className="text-xs font-bold text-gray-900">{opp.probability || 0}%</p>
                                                                        </div>
                                                                        <div className="w-full bg-gray-300 rounded-full h-1.5">
                                                                            <div
                                                                                className="bg-indigo-600 h-1.5 rounded-full transition-all"
                                                                                style={{ width: `${opp.probability || 0}%` }}
                                                                            ></div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Action Button - Shows in QUOTE stage */}
                                                                    {stageKey === 'QUOTE' && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleSubmitForUnderwriting(opp.id);
                                                                            }}
                                                                            className="w-full mt-2 inline-flex items-center justify-center rounded bg-green-600 px-2 py-1.5 text-xs font-bold text-white shadow hover:bg-green-700 transition-colors"
                                                                        >
                                                                            <ArrowRightIcon className="h-3 w-3 mr-1" />
                                                                            Submit
                                                                        </button>
                                                                    )}

                                                                    {/* Notes (if any) */}
                                                                    {opp.notes && (
                                                                        <div className="mt-1.5 pt-1.5 border-t border-gray-300 text-xs text-gray-700 line-clamp-1">
                                                                            {opp.notes}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))
                                                )}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            );
                        })}
                    </div>
                </DragDropContext>
            </div>

            {/* Create/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={selectedOpp ? "Edit Deal" : "Create New Deal"}>
                <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-900">Deal Name</label>
                        <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            placeholder="e.g., $50K Policy - John Smith"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-900">Pipeline Stage</label>
                            <select
                                name="stage"
                                value={formData.stage}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            >
                                {Object.entries(STAGES).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-900">Win Probability (%)</label>
                            <input
                                type="number"
                                name="probability"
                                min="0"
                                max="100"
                                value={formData.probability}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900">Expected Premium ($)</label>
                        <input
                            type="number"
                            name="expected_revenue"
                            min="0"
                            step="100"
                            value={formData.expected_revenue}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900">Notes</label>
                        <textarea
                            name="notes"
                            rows="3"
                            value={formData.notes}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            placeholder="Add any notes about this opportunity..."
                        />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            {selectedOpp ? "Update Deal" : "Create Deal"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Opportunities;
