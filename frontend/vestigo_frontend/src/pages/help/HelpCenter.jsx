import { Tab } from '@headlessui/react';
import {
    ChatBubbleLeftRightIcon,
    ShieldCheckIcon,
    DocumentTextIcon,
    ClipboardDocumentCheckIcon,
    ArrowUpTrayIcon
} from '@heroicons/react/24/outline';

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

const HelpCenter = () => {
    const categories = [
        {
            name: 'Sales & BDM',
            icon: ChatBubbleLeftRightIcon,
            steps: [
                { title: 'Create a Lead', desc: 'Go to Leads > New Lead. Enter prospect details.' },
                { title: 'Qualify Opportunity', desc: 'Convert Lead to Opportunity. Move card to "Qualified".' },
                { title: 'Generate Quote', desc: 'Move to "Quote Sent". This enables the Underwriting submission.' },
                { title: 'Submit for Review', desc: 'Click "Submit for Underwriting" on the Kanban card.' }
            ]
        },
        {
            name: 'Underwriting',
            icon: ShieldCheckIcon,
            steps: [
                { title: 'Receive Request', desc: 'Check the Notification bell or go to "Underwriting" from sidebar.' },
                { title: 'Review Risk', desc: 'Analyze applicant data and requested premium.' },
                { title: 'Approve', desc: 'Click "Approve & Issue Policy". This automatically generates the Policy.' },
                { title: 'Reject', desc: 'Click Reject. The BDM will be notified.' }
            ]
        },
        {
            name: 'Claims',
            icon: ClipboardDocumentCheckIcon,
            steps: [
                { title: 'File Claim', desc: 'Go to Claims > File New Claim. Select the active Policy.' },
                { title: 'Initial Review', desc: 'Status starts as "Reported". Review documents.' },
                { title: 'Process', desc: 'Update status to "In Progress" or "Approved".' }
            ]
        },
        {
            name: 'Reconciliation',
            icon: ArrowUpTrayIcon,
            steps: [
                { title: 'Upload Statement', desc: 'Go to Reconciliation. Upload CSV bank statement.' },
                { title: 'Auto Match', desc: 'Click "Run Auto Match". System matches exact amounts.' },
                { title: 'Manual Match', desc: 'For unmatched lines, enter Policy ID manually.' }
            ]
        }
    ];

    return (
        <div className="px-4 py-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Help Center & User Guide</h1>

            <Tab.Group>
                <Tab.List className="flex space-x-1 rounded-xl bg-indigo-900/20 p-1">
                    {categories.map((category) => (
                        <Tab
                            key={category.name}
                            className={({ selected }) =>
                                classNames(
                                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-indigo-700',
                                    'ring-white ring-opacity-60 ring-offset-2 ring-offset-indigo-400 focus:outline-none focus:ring-2',
                                    selected
                                        ? 'bg-white shadow'
                                        : 'text-indigo-600 hover:bg-white/[0.12] hover:text-white'
                                )
                            }
                        >
                            <div className="flex items-center justify-center gap-2">
                                <category.icon className="h-5 w-5" />
                                {category.name}
                            </div>
                        </Tab>
                    ))}
                </Tab.List>
                <Tab.Panels className="mt-6">
                    {categories.map((category, idx) => (
                        <Tab.Panel
                            key={idx}
                            className={classNames(
                                'rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200',
                                'focus:outline-none focus:ring-2'
                            )}
                        >
                            <div className="flow-root">
                                <ul role="list" className="-mb-8">
                                    {category.steps.map((step, stepIdx) => (
                                        <li key={step.title}>
                                            <div className="relative pb-8">
                                                {stepIdx !== category.steps.length - 1 ? (
                                                    <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                                ) : null}
                                                <div className="relative flex space-x-3">
                                                    <div>
                                                        <span className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center ring-8 ring-white">
                                                            <span className="text-indigo-600 font-bold text-sm">{stepIdx + 1}</span>
                                                        </span>
                                                    </div>
                                                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                                                            <p className="text-sm text-gray-500 mt-1">{step.desc}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </Tab.Panel>
                    ))}
                </Tab.Panels>
            </Tab.Group>
        </div>
    );
};

export default HelpCenter;
