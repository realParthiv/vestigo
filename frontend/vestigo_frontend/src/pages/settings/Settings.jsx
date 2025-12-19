import { Link } from 'react-router-dom';
import { Cog6ToothIcon, QuestionMarkCircleIcon, ShieldCheckIcon, BellIcon } from '@heroicons/react/24/outline';

const settingsSections = [
  {
    title: 'General',
    description: 'Manage account preferences and profile.',
    actions: [
      { label: 'Profile (coming soon)', to: '#', icon: ShieldCheckIcon, disabled: true },
    ],
  },
  {
    title: 'Notifications',
    description: 'Control how you receive alerts.',
    actions: [
      { label: 'Notification Preferences (coming soon)', to: '#', icon: BellIcon, disabled: true },
    ],
  },
  {
    title: 'Support',
    description: 'Find docs and get help.',
    actions: [
      { label: 'Late Charge Policies', to: '/late-charge-policies', icon: Cog6ToothIcon },
      { label: 'Help Center', to: '/help', icon: QuestionMarkCircleIcon },
      { label: 'Contact Support (coming soon)', to: '#', icon: Cog6ToothIcon, disabled: true },
    ],
  },
];

export default function Settings() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">Organized place for infrequent links and preferences.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {settingsSections.map((section) => (
          <div key={section.title} className="bg-white shadow rounded-lg p-5 border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
                <p className="text-sm text-gray-600 mt-1">{section.description}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {section.actions.map((action) => (
                <Link
                  key={action.label}
                  to={action.to}
                  onClick={(e) => action.disabled && e.preventDefault()}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium border transition ${
                    action.disabled
                      ? 'text-gray-400 bg-gray-50 border-gray-100 cursor-not-allowed'
                      : 'text-indigo-700 bg-indigo-50 border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200'
                  }`}
                >
                  <action.icon className="h-5 w-5" />
                  <span>{action.label}</span>
                  {action.disabled && <span className="ml-auto text-xs text-gray-400">Soon</span>}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
