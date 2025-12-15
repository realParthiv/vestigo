import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Policies from './pages/operations/Policies';
import PolicyDetails from './pages/operations/PolicyDetails';
import Claims from './pages/claims/Claims';
import SubmissionList from './pages/underwriting/SubmissionList';
import SubmissionDetail from './pages/underwriting/SubmissionDetail';
import ReconciliationDashboard from './pages/reconciliation/ReconciliationDashboard';
import StatementDetail from './pages/reconciliation/StatementDetail';
import ReportsDashboard from './pages/reports/ReportsDashboard';
import HelpCenter from './pages/help/HelpCenter';
import DashboardLayout from './components/layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Leads from './pages/bdm/Leads';
import Opportunities from './pages/bdm/Opportunities';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<PrivateRoute />}>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="leads" element={<Leads />} />
            <Route path="opportunities" element={<Opportunities />} />
            <Route path="policies" element={<Policies />} />
            <Route path="policies/:id" element={<PolicyDetails />} />
            <Route path="claims" element={<Claims />} />
            <Route path="underwriting" element={<SubmissionList />} />
            <Route path="underwriting/:id" element={<SubmissionDetail />} />
            <Route path="reconciliation" element={<ReconciliationDashboard />} />
            <Route path="reconciliation/:id" element={<StatementDetail />} />
            <Route path="reports" element={<ReportsDashboard />} />
            <Route path="help" element={<HelpCenter />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
