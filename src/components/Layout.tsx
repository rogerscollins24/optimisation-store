import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  Layers,
  ListTodo,
  ArrowRightLeft,
  CreditCard,
  Bell,
  Star,
  ClipboardList,
  PlusCircle,
  UserPlus,
  MousePointerClick,
  Settings,
  Moon,
  Sun,
  LogOut,
  Menu,
  X,
  Search,
  UserCircle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Combos', href: '/combos', icon: Layers },
  { name: 'Tasks', href: '/tasks', icon: ListTodo },
  { name: 'Transactions', href: '/transactions', icon: ArrowRightLeft },
  { name: 'Withdrawals', href: '/withdrawals', icon: CreditCard },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'VIP Levels', href: '/vip-levels', icon: Star },
  { name: 'Activity Logs', href: '/activity-logs', icon: ClipboardList },
  { name: 'Balance Adder', href: '/balance-adder', icon: PlusCircle },
  { name: 'Tracked Clicks', href: '/tracked-clicks', icon: MousePointerClick },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const initialTrainingForm = {
  username: '',
  phone: '',
  login_password: '',
  withdraw_password: '',
  invite_code: '',
  referred_by: '',
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [isSubmittingTraining, setIsSubmittingTraining] = useState(false);
  const [trainingError, setTrainingError] = useState('');
  const [trainingSuccess, setTrainingSuccess] = useState('');
  const [trainingForm, setTrainingForm] = useState(initialTrainingForm);
  const location = useLocation();

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const setTrainingField = (key: keyof typeof initialTrainingForm, value: string) => {
    setTrainingForm((prev) => ({ ...prev, [key]: value }));
  };

  const openTrainingModal = () => {
    setTrainingError('');
    setTrainingSuccess('');
    setTrainingForm(initialTrainingForm);
    setShowTrainingModal(true);
  };

  const handleCreateTrainingAccount = async () => {
    if (!trainingForm.username.trim()) {
      setTrainingError('Username is required.');
      return;
    }
    if (!trainingForm.login_password.trim()) {
      setTrainingError('Login password is required.');
      return;
    }
    if (!trainingForm.withdraw_password.trim()) {
      setTrainingError('Withdraw password is required.');
      return;
    }
    if (!trainingForm.referred_by.trim()) {
      setTrainingError('Referral code is required to link the training account.');
      return;
    }

    setIsSubmittingTraining(true);
    setTrainingError('');
    setTrainingSuccess('');

    try {
      const res = await fetch('/api/users/training-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: trainingForm.username.trim(),
          phone: trainingForm.phone.trim() || null,
          login_password: trainingForm.login_password,
          withdraw_password: trainingForm.withdraw_password,
          invite_code: trainingForm.invite_code.trim() || null,
          referred_by: trainingForm.referred_by.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTrainingError(data?.detail || 'Failed to create training account.');
        return;
      }

      setTrainingSuccess('Training account created and linked. Inviter will receive 25% commission on earnings.');
      setTimeout(() => setShowTrainingModal(false), 900);
    } catch {
      setTrainingError('Could not connect to server.');
    } finally {
      setIsSubmittingTraining(false);
    }
  };

  return (
    <div className={cn("min-h-screen flex", isDarkMode ? "dark bg-[#0f172a] text-slate-200" : "bg-slate-50 text-slate-900")}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isDarkMode ? "bg-[#1e293b] border-r border-slate-700" : "bg-white border-r border-slate-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-xl font-bold tracking-tight">Admin Panel</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-4rem)] py-4 px-3 space-y-1 custom-scrollbar">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-600/10 text-blue-500"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                )}
              >
                <item.icon size={18} className={cn(isActive ? "text-blue-500" : "text-slate-400")} />
                {item.name}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className={cn(
          "h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b z-10",
          isDarkMode ? "bg-[#1e293b] border-slate-700" : "bg-white border-slate-200"
        )}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-400 hover:text-slate-200"
            >
              <Menu size={24} />
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">
              <Search size={16} className="text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-sm w-64 text-slate-200 placeholder-slate-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={openTrainingModal}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
            >
              <UserPlus size={16} />
              Add User
            </button>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="p-2 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="h-8 w-px bg-slate-700 mx-1"></div>
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-slate-200">Admin User</div>
                <div className="text-xs text-slate-400">Super Admin</div>
              </div>
              <UserCircle size={32} className="text-slate-400" />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <Outlet />
        </main>
      </div>

      {showTrainingModal && (
        <div className="fixed inset-0 z-[70] bg-slate-900/70 flex items-start justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl mt-8 mb-8 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
              <h2 className="text-3xl font-semibold text-slate-100">Create Training Account</h2>
              <button
                onClick={() => setShowTrainingModal(false)}
                className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xl font-medium text-slate-200 mb-1">Username *</label>
                <input
                  type="text"
                  value={trainingForm.username}
                  onChange={(e) => setTrainingField('username', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg p-2.5 outline-none"
                  placeholder="Training username"
                />
              </div>

              <div>
                <label className="block text-xl font-medium text-slate-200 mb-1">Phone *</label>
                <input
                  type="text"
                  value={trainingForm.phone}
                  onChange={(e) => setTrainingField('phone', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg p-2.5 outline-none"
                  placeholder="Phone number"
                />
              </div>

              <div>
                <label className="block text-xl font-medium text-slate-200 mb-1">Login Password *</label>
                <input
                  type="password"
                  value={trainingForm.login_password}
                  onChange={(e) => setTrainingField('login_password', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg p-2.5 outline-none"
                  placeholder="Login password"
                />
              </div>

              <div>
                <label className="block text-xl font-medium text-slate-200 mb-1">Withdraw Password *</label>
                <input
                  type="password"
                  value={trainingForm.withdraw_password}
                  onChange={(e) => setTrainingField('withdraw_password', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg p-2.5 outline-none"
                  placeholder="Withdraw password"
                />
              </div>

              <div>
                <label className="block text-xl font-medium text-slate-200 mb-1">Invite Code (optional)</label>
                <input
                  type="text"
                  value={trainingForm.invite_code}
                  onChange={(e) => setTrainingField('invite_code', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg p-2.5 outline-none"
                  placeholder="Leave empty to auto-generate"
                />
              </div>

              <div>
                <label className="block text-xl font-medium text-slate-200 mb-1">Link to Inviter (referredBy) *</label>
                <input
                  type="text"
                  value={trainingForm.referred_by}
                  onChange={(e) => setTrainingField('referred_by', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg p-2.5 outline-none"
                  placeholder="Client invite code (the inviter)"
                />
              </div>

              {trainingError && <p className="text-sm text-rose-400">{trainingError}</p>}
              {trainingSuccess && <p className="text-sm text-emerald-400">{trainingSuccess}</p>}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowTrainingModal(false)}
                  className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                  disabled={isSubmittingTraining}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTrainingAccount}
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isSubmittingTraining}
                >
                  {isSubmittingTraining ? 'Creating...' : 'Create & Link'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
