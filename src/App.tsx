import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Products from './pages/Products';
import Combos from './pages/Combos';
import Tasks from './pages/Tasks';
import Transactions from './pages/Transactions';
import Withdrawals from './pages/Withdrawals';
import ActivityLogs from './pages/ActivityLogs';
import VIPLevels from './pages/VIPLevels';
import BalanceAdder from './pages/BalanceAdder';
import TrackedClicks from './pages/TrackedClicks';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="products" element={<Products />} />
          <Route path="combos" element={<Combos />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="withdrawals" element={<Withdrawals />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="activity-logs" element={<ActivityLogs />} />
          <Route path="vip-levels" element={<VIPLevels />} />
          <Route path="balance-adder" element={<BalanceAdder />} />
          <Route path="tracked-clicks" element={<TrackedClicks />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
