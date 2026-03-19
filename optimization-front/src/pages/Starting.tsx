import { useEffect, useState } from 'react';
import { Bell, UserCircle, Star, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser, Task } from '../store';
import { useAuth } from '../context/AuthContext';

interface Product {
  id: number;
  name: string;
  price: number;
  image_url?: string | null;
}

const taskTotalsByVip: Record<number, number> = {
  1: 40,
  2: 45,
  3: 50,
  4: 55,
};

export default function Starting() {
  const { user, refreshUser, setUser } = useAuth();
  const { addTask } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [pendingTaskBlocked, setPendingTaskBlocked] = useState(false);
  const [supportUrl, setSupportUrl] = useState('https://t.me/');
  const [requiredDeposit, setRequiredDeposit] = useState<number | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  const totalTasks = user ? taskTotalsByVip[user.vip_level] ?? 60 : 40;

  useEffect(() => {
    fetch('/api/products')
      .then((response) => response.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    const loadPendingTask = async () => {
      if (!user?.id) return;
      try {
        const response = await fetch(`/api/users/${user.id}/pending-tasks`);
        if (!response.ok) return;
        const data = await response.json();
        const tasks = Array.isArray(data.tasks) ? data.tasks : [];
        setSupportUrl(typeof data.supportUrl === 'string' && data.supportUrl ? data.supportUrl : 'https://t.me/');

        if (tasks.length > 0) {
          const task = mapTaskRecord(tasks[0]);
          setCurrentTask(task);
          setPendingTaskBlocked(true);
          if (task.status === 'pending_debited' && user.balance < 0) {
            const needed = Math.abs(user.balance);
            setRequiredDeposit(needed);
            setDepositAmount(needed.toFixed(2));
          }
        } else {
          setPendingTaskBlocked(false);
          setCurrentTask(null);
          setRequiredDeposit(null);
          setDepositAmount('');
        }
      } catch {
        // Ignore fetch errors and allow user to retry manually.
      }
    };

    loadPendingTask();
  }, [user?.id, user?.balance]);

  const mapTaskRecord = (taskRecord: any): Task => ({
    id: String(taskRecord.id),
    title: taskRecord.product_name,
    image: taskRecord.image_url || 'https://picsum.photos/seed/fallback/300/300',
    price: taskRecord.amount,
    commission: taskRecord.commission,
    status: taskRecord.status,
    createdAt: taskRecord.created_at,
    taskCode: taskRecord.task_code,
    isCombo: !!taskRecord.is_combo,
    comboId: taskRecord.combo_id ?? null,
    products: Array.isArray(taskRecord.products) ? taskRecord.products : [],
  });

  const parseError = async (response: Response) => {
    const body = await response.json().catch(() => ({}));
    if (body?.detail && typeof body.detail === 'object') {
      return body.detail;
    }
    if (typeof body?.detail === 'string') {
      return { message: body.detail };
    }
    return { message: 'Request failed' };
  };

  const handleStart = async () => {
    if (!user) return;
    if (user.tasks_completed_in_set >= totalTasks) {
      alert('You have completed all tasks for this set.');
      return;
    }

    setIsOptimizing(true);
    try {
      const response = await fetch('/api/tasks/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          currentTaskNumber: (user.tasks_completed_in_set ?? 0) + 1,
        }),
      });
      if (!response.ok) {
        const error = await parseError(response);
        if (error.task) {
          setCurrentTask(mapTaskRecord(error.task));
          setPendingTaskBlocked(true);
          setSupportUrl(typeof error.supportUrl === 'string' && error.supportUrl ? error.supportUrl : 'https://t.me/');
          return;
        }
        throw new Error(error.message || 'Task failed');
      }

      const data = await response.json();
      setSupportUrl(typeof data.supportUrl === 'string' && data.supportUrl ? data.supportUrl : 'https://t.me/');
      setCurrentTask(mapTaskRecord(data.task));
      setPendingTaskBlocked(true);
      setRequiredDeposit(null);
      setDepositAmount('');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to start task');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSubmitTask = async () => {
    if (!currentTask) return;
    if (!user) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/users/${user.id}/submit-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskCode: currentTask.taskCode }),
      });

      if (!response.ok) {
        const error = await parseError(response);
        if (error.code === 'INSUFFICIENT_BALANCE') {
          const needed = Number(error.requiredDeposit || 0);
          setRequiredDeposit(needed);
          setDepositAmount(needed > 0 ? needed.toFixed(2) : '');
          setSupportUrl(typeof error.supportUrl === 'string' && error.supportUrl ? error.supportUrl : supportUrl);
          if (error.task) {
            setCurrentTask(mapTaskRecord(error.task));
          }
          await refreshUser();
          return;
        }
        throw new Error(error.message || 'Submit failed');
      }

      const data = await response.json();
      const mappedTask = mapTaskRecord(data.task_record);
      addTask(mappedTask);
      setCurrentTask(null);
      setRequiredDeposit(null);
      setDepositAmount('');
      setPendingTaskBlocked(false);
      if (data.user) {
        setUser({ ...data.user, credit_score: data.user.credit_score ?? 100 });
      }
      await refreshUser();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to submit task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setCurrentTask(null);
    setPendingTaskBlocked(true);
  };

  const hasDepositWarning = requiredDeposit !== null || ((currentTask?.status === 'pending_debited') && (user?.balance ?? 0) < 0);
  const computedRequiredDeposit = requiredDeposit ?? (user && user.balance < 0 ? Math.abs(user.balance) : 0);

  return (
    <div className="flex flex-col min-h-full bg-gray-50 pb-6 relative">
      <div className="flex justify-between items-center p-4 bg-white shadow-sm">
        <h1 className="text-xl font-bold text-blue-600">Stacks</h1>
        <div className="flex items-center gap-4">
          <Bell className="text-gray-600" size={24} />
          <Link to="/profile">
            <UserCircle className="text-gray-600" size={28} />
          </Link>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">👋</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Hi, {user?.username}</h2>
            <div className="flex items-center gap-2">
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-bold">VIP {user?.vip_level ?? 1}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-md">
            <p className="text-sm opacity-80 mb-1">Total Balance</p>
            <p className="text-xl font-bold">{(user?.balance ?? 0).toFixed(2)} <span className="text-sm font-normal">USDT</span></p>
          </div>
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 text-white shadow-md">
            <p className="text-sm opacity-80 mb-1">Today's Commission</p>
            <p className="text-xl font-bold">{(user?.commission_today ?? 0).toFixed(2)} <span className="text-sm font-normal">USDT</span></p>
          </div>
        </div>

        <div className="mb-4 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Start Optimization</h3>
          <span className="text-sm text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
            {user?.tasks_completed_in_set ?? 0}/{totalTasks}
          </span>
        </div>

        <div className="relative bg-white p-4 rounded-xl shadow-sm border border-gray-100 min-h-[300px] flex items-center justify-center">
          <div className="grid grid-cols-3 gap-4 opacity-40 absolute inset-0 p-4 pointer-events-none">
            {products.slice(0, 9).map((product) => (
              <div key={product.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img src={product.image_url || 'https://picsum.photos/seed/default/300/300'} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>

          <button
            onClick={handleStart}
            disabled={isOptimizing || pendingTaskBlocked || (user?.tasks_completed_in_set ?? 0) >= totalTasks}
            className={`relative z-10 w-32 h-32 rounded-full flex flex-col items-center justify-center text-white font-bold text-xl shadow-2xl transition-transform active:scale-95 ${
              (isOptimizing || pendingTaskBlocked) ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
            }`}
          >
            {isOptimizing ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
            ) : (
              <span className="text-4xl mb-1">🚀</span>
            )}
            {isOptimizing ? 'Optimizing...' : pendingTaskBlocked ? 'Pending' : 'Start'}
          </button>
        </div>

        {pendingTaskBlocked && !currentTask && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            You have a pending task and cannot start a new one until it is submitted.
            <button onClick={() => window.location.reload()} className="ml-2 underline font-medium">
              Resume Pending Task
            </button>
          </div>
        )}
      </div>

      {currentTask && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">Task Submission</h3>
              <button onClick={handleCloseModal} className="text-white/80 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex gap-4 mb-6">
                <img src={currentTask.image} alt="Product" className="w-24 h-24 object-cover rounded-lg shadow-sm" />
                <div>
                  <h4 className="font-medium text-gray-800 line-clamp-2 mb-2">{currentTask.title}</h4>
                  <p className="text-blue-600 font-bold">USDT {currentTask.price.toFixed(2)}</p>
                  <div className="flex text-yellow-400 mt-1">
                    {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                  </div>
                </div>
              </div>

              {currentTask.isCombo && currentTask.products && currentTask.products.length > 0 && (
                <div className="space-y-2 mb-4">
                  {currentTask.products.map((item) => (
                    <div key={item.product_id} className="flex items-center justify-between text-sm rounded-lg bg-blue-50 px-3 py-2 border border-blue-100">
                      <span className="text-gray-700">{item.product_name}</span>
                      <span className="font-semibold text-blue-700">USDT {Number(item.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Amount</span>
                  <span className="font-bold text-gray-800">USDT {currentTask.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Commission</span>
                  <span className="font-bold text-green-600">USDT {currentTask.commission.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Created At</span>
                  <span className="text-gray-800">{new Date(currentTask.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Task Code</span>
                  <span className="text-gray-800 font-mono">{currentTask.taskCode}</span>
                </div>
              </div>

              {hasDepositWarning && (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 space-y-2">
                  <p className="font-semibold">Insufficient balance. Please deposit to continue.</p>
                  <p>Required deposit: USDT {computedRequiredDeposit.toFixed(2)}</p>
                  <div>
                    <label className="block text-xs text-rose-600 mb-1">Deposit amount</label>
                    <input
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-gray-800"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Link to="/deposit" className="text-blue-600 underline font-medium">Go to Deposit</Link>
                    <a href={supportUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline font-medium">Contact Support / Chat</a>
                  </div>
                </div>
              )}

              <button
                onClick={handleSubmitTask}
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
