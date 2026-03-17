import { useState, useEffect } from 'react';
import {
  Users,
  Package,
  ListTodo,
  ArrowRightLeft,
  CreditCard,
  Layers,
  Star,
  ClipboardList,
  PlusCircle,
  MousePointerClick,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

const transactionData = [
  { name: 'Mon', transactions: 120 },
  { name: 'Tue', transactions: 150 },
  { name: 'Wed', transactions: 180 },
  { name: 'Thu', transactions: 140 },
  { name: 'Fri', transactions: 210 },
  { name: 'Sat', transactions: 250 },
  { name: 'Sun', transactions: 190 },
];

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        setDashboardData(data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      }
    };
    fetchStats();
  }, []);

  if (!dashboardData) {
    return <div className="text-slate-400">Loading dashboard...</div>;
  }

  if (dashboardData.error) {
    return <div className="text-rose-400">Error loading dashboard: {dashboardData.error}</div>;
  }

  const stats = [
    { name: 'Total Users', value: dashboardData.stats.totalUsers, icon: Users, change: '+12%', trend: 'up' },
    { name: 'Total Products', value: dashboardData.stats.totalProducts, icon: Package, change: '+5%', trend: 'up' },
    { name: 'Total Tasks', value: dashboardData.stats.totalTasks, icon: ListTodo, change: '+18%', trend: 'up' },
    { name: 'Total Transactions', value: '1,234', icon: ArrowRightLeft, change: '+24%', trend: 'up' },
    { name: 'Total Withdrawals', value: dashboardData.stats.totalWithdrawals, icon: CreditCard, change: '-2%', trend: 'down' },
    { name: 'Total Combos', value: dashboardData.stats.totalCombos, icon: Layers, change: '0%', trend: 'neutral' },
    { name: 'Total VIP Levels', value: '5', icon: Star, change: '0%', trend: 'neutral' },
    { name: 'Total Activity Logs', value: dashboardData.stats.totalLogs, icon: ClipboardList, change: '+45%', trend: 'up' },
    { name: 'Total Balance Adders', value: '23', icon: PlusCircle, change: '+10%', trend: 'up' },
    { name: 'Total Tracked Clicks', value: '12,345', icon: MousePointerClick, change: '+120%', trend: 'up' },
  ];

  const vipData = dashboardData.vipDistribution.map((v: any) => ({
    name: `VIP ${v.name}`,
    users: v.users
  }));

  const recentActivity = dashboardData.recentActivity.map((log: any) => ({
    id: log.id,
    user: log.admin, // Using admin as user for now
    action: log.action,
    amount: log.details,
    date: new Date(log.created_at).toLocaleString(),
    status: 'success' // Defaulting to success for logs
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Dashboard Overview</h1>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
            Download Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex flex-col gap-3 hover:bg-slate-800/80 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 bg-slate-700/50 rounded-lg">
                <stat.icon className="w-5 h-5 text-blue-400" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${
                stat.trend === 'up' ? 'text-emerald-400' : 
                stat.trend === 'down' ? 'text-rose-400' : 'text-slate-400'
              }`}>
                {stat.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : 
                 stat.trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
                {stat.change}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-100">{stat.value}</div>
              <div className="text-sm text-slate-400 font-medium">{stat.name}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* VIP Distribution Chart */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-6">Users by VIP Level</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vipData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: '#334155', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                />
                <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transactions Chart */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-6">Transactions Over Time</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={transactionData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="transactions" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#1e293b' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">Recent Activity</h2>
          <button className="text-sm text-blue-400 hover:text-blue-300 font-medium">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="text-xs text-slate-300 uppercase bg-slate-800/80 border-b border-slate-700/50">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Action</th>
                <th className="px-6 py-4 font-medium">Details</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {recentActivity.map((activity: any) => (
                <tr key={activity.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-200">{activity.user}</td>
                  <td className="px-6 py-4">{activity.action}</td>
                  <td className="px-6 py-4 text-slate-400">{activity.amount}</td>
                  <td className="px-6 py-4">{activity.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      activity.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      activity.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
