import { useEffect, useMemo, useState } from 'react';
import { Bell, UserCircle, Star, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser, Task } from '../store';
import { useAuth } from '../context/AuthContext';
import ChatModal from '../components/ChatModal';

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

const productGridSlots = [0, 1, 2, 3, 5, 6, 7, 8];

const shuffleProducts = (items: Product[]) => {
  const nextItems = [...items];

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [nextItems[index], nextItems[randomIndex]] = [nextItems[randomIndex], nextItems[index]];
  }

  return nextItems;
};

const getVisibleProducts = (items: Product[], count = 8) => {
  if (items.length === 0) {
    return [];
  }

  return shuffleProducts(items).slice(0, Math.min(count, items.length));
};

export default function Starting() {
  const { user, refreshUser, setUser } = useAuth();
  const supportToken = user?.access_token ?? null;
  const { addTask } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [visibleProducts, setVisibleProducts] = useState<Product[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [pendingTaskBlocked, setPendingTaskBlocked] = useState(false);
  const [supportUrl, setSupportUrl] = useState('https://t.me/');
  const [requiredDeposit, setRequiredDeposit] = useState<number | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [chatSignal, setChatSignal] = useState(-1);

  const totalTasks = user ? taskTotalsByVip[user.vip_level] ?? 60 : 40;

  useEffect(() => {
    fetch('/api/products')
      .then((response) => response.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    if (products.length === 0) {
      setVisibleProducts([]);
      return;
    }

    setVisibleProducts(getVisibleProducts(products));

    if (currentTask) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setVisibleProducts(getVisibleProducts(products));
    }, 8000);

    return () => window.clearInterval(intervalId);
  }, [products, currentTask]);

  useEffect(() => {
    const loadPendingTask = async () => {
      if (!user?.id) return;
      try {
        const response = await fetch(`/api/users/${user.id}/pending-tasks`);
        if (!response.ok) return;
        const data = await response.json();
        const tasks = Array.isArray(data.tasks) ? data.tasks : [];
        const mappedTasks = tasks.map((taskRecord: any) => mapTaskRecord(taskRecord));
        setSupportUrl(typeof data.supportUrl === 'string' && data.supportUrl ? data.supportUrl : 'https://t.me/');
        setPendingTasks(mappedTasks);

        if (mappedTasks.length > 0) {
          const task = mappedTasks[0];
          setCurrentTask(task);
          setPendingTaskBlocked(true);
          if (task.status === 'pending_debited' && user.balance < 0) {
            const needed = Math.abs(user.balance);
            setRequiredDeposit(needed);
            setDepositAmount(needed.toFixed(2));
          }
        } else {
          setPendingTasks([]);
          setPendingTaskBlocked(false);
          setCurrentTask(null);
          setRequiredDeposit(null);
          setDepositAmount('');
        }
      } catch {
        setPendingTasks([]);
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
      const mappedTask = mapTaskRecord(data.task);
      setCurrentTask(mappedTask);
      setPendingTasks([mappedTask]);
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
      setPendingTasks((previousTasks) => previousTasks.filter((task) => task.taskCode !== currentTask.taskCode));
      setCurrentTask(null);
      setRequiredDeposit(null);
      setDepositAmount('');
      setPendingTaskBlocked(false);
      if (data.user) {
        setUser((previous) => ({
          ...data.user,
          credit_score: data.user.credit_score ?? 100,
          access_token: previous?.access_token,
          token_type: previous?.token_type,
        }));
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

  const productCells = useMemo(() => {
    const cells = Array.from({ length: 9 }, () => null as Product | null);

    productGridSlots.forEach((slotIndex, productIndex) => {
      cells[slotIndex] = visibleProducts[productIndex] ?? null;
    });

    return cells;
  }, [visibleProducts]);

  const hasDepositWarning = requiredDeposit !== null || ((currentTask?.status === 'pending_debited') && (user?.balance ?? 0) < 0);
  const computedRequiredDeposit = requiredDeposit ?? (user && user.balance < 0 ? Math.abs(user.balance) : 0);

  return (
    <div className="relative flex min-h-full flex-col bg-gray-50 pb-6">
      <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm md:p-5">
        <h1 className="text-xl font-bold text-blue-600">Stacks</h1>
        <div className="flex items-center gap-4">
          <Bell className="text-gray-600" size={24} />
          <Link to="/profile">
            <UserCircle className="text-gray-600" size={28} />
          </Link>
        </div>
      </div>

      <div className="grid gap-6 p-4 lg:grid-cols-[1fr_320px] lg:items-start md:p-6">
        <div>
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

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
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

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:p-6">
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {productCells.map((product, cellIndex) => {
              if (cellIndex === 4) {
                return (
                  <div key="start-cell" className="aspect-square">
                    <button
                      onClick={handleStart}
                      disabled={isOptimizing || pendingTaskBlocked || (user?.tasks_completed_in_set ?? 0) >= totalTasks}
                      className={`mx-auto flex h-full w-full max-h-[180px] max-w-[180px] flex-col items-center justify-center rounded-full text-center text-white font-bold text-lg shadow-2xl transition-transform active:scale-95 ${
                        (isOptimizing || pendingTaskBlocked || (user?.tasks_completed_in_set ?? 0) >= totalTasks)
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                      }`}
                    >
                      {isOptimizing ? (
                        <div className="mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-white"></div>
                      ) : (
                        <span className="mb-2 text-4xl">🚀</span>
                      )}
                      <span>{isOptimizing ? 'Optimizing...' : pendingTaskBlocked ? 'Pending' : 'Start'}</span>
                    </button>
                  </div>
                );
              }

              return (
                <div key={`product-cell-${cellIndex}`} className="aspect-square overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 shadow-sm">
                  {product ? (
                    <img
                      src={product.image_url || 'https://picsum.photos/seed/default/300/300'}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                      Waiting
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <span>Products rotate every 8 seconds.</span>
            <span>{Math.min(visibleProducts.length, 8)}/8 visible</span>
          </div>
        </div>

        {pendingTaskBlocked && !currentTask && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            You have a pending task and cannot start a new one until it is submitted.
            <button onClick={() => window.location.reload()} className="ml-2 underline font-medium">
              Resume Pending Task
            </button>
          </div>
        )}

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">Pending</h3>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              {pendingTasks.length} active
            </span>
          </div>

          {pendingTasks.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              No pending tasks right now.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {pendingTasks.map((task) => (
                <div key={task.taskCode} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <img src={task.image} alt={task.title} className="h-20 w-20 rounded-xl object-cover bg-slate-100" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h4 className="line-clamp-2 font-semibold text-slate-800">{task.title}</h4>
                          <p className="mt-1 text-xs text-slate-500">{new Date(task.createdAt).toLocaleString()}</p>
                        </div>
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          task.status === 'pending_debited' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {task.status === 'pending_debited' ? 'Pending Deposit' : 'Pending'}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                        <div className="rounded-lg bg-slate-50 px-3 py-2">
                          <p className="text-xs text-slate-500">Amount</p>
                          <p className="font-semibold text-slate-800">USDT {task.price.toFixed(2)}</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 px-3 py-2">
                          <p className="text-xs text-slate-500">Commission</p>
                          <p className="font-semibold text-emerald-600">USDT {task.commission.toFixed(2)}</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 px-3 py-2 col-span-2 sm:col-span-1">
                          <p className="text-xs text-slate-500">Task Code</p>
                          <p className="font-mono text-xs font-semibold text-slate-800">{task.taskCode}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          onClick={() => {
                            setCurrentTask(task);
                            setPendingTaskBlocked(true);
                          }}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          Resume Task
                        </button>
                        {task.status === 'pending_debited' && (
                          <Link to="/deposit" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                            Deposit Funds
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">Task Progress</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">{user?.tasks_completed_in_set ?? 0}<span className="text-base text-slate-500">/{totalTasks}</span></p>
          <p className="mt-4 text-sm text-slate-600">Complete the current pending task before starting the next one. Use Deposit if your balance is insufficient.</p>
          <div className="mt-5 space-y-2 text-sm">
            <Link to="/records" className="block rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 font-medium text-blue-700">View Records</Link>
            <Link to="/deposit" className="block rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 font-medium text-emerald-700">Go to Deposit</Link>
          </div>
        </div>
      </div>

      {currentTask && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">Task Submission</h3>
              <button onClick={handleCloseModal} className="text-white/80 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 md:p-8">
              <div className="mb-6 grid gap-6 md:grid-cols-2">
                <div className="flex gap-4">
                <img src={currentTask.image} alt="Product" className="w-24 h-24 object-cover rounded-lg shadow-sm" />
                <div>
                  <h4 className="font-medium text-gray-800 line-clamp-2 mb-2">{currentTask.title}</h4>
                  <p className="text-blue-600 font-bold">USDT {currentTask.price.toFixed(2)}</p>
                  <div className="flex text-yellow-400 mt-1">
                    {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                  </div>
                </div>
                </div>

                <div>
                  {currentTask.isCombo && currentTask.products && currentTask.products.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {currentTask.products.map((item) => (
                        <div key={item.product_id} className="flex items-center justify-between text-sm rounded-lg bg-blue-50 px-3 py-2 border border-blue-100">
                          <span className="text-gray-700">{item.product_name}</span>
                          <span className="font-semibold text-blue-700">USDT {Number(item.price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
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
                    <button
                      onClick={() => setChatSignal((prev) => prev + 1)}
                      className="text-blue-600 underline font-medium"
                    >
                      Contact Support / Chat
                    </button>
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

      <ChatModal
        token={supportToken}
        openSignal={chatSignal}
        presetSubject="Balance issue"
        presetMessage={
          hasDepositWarning
            ? `Hello Support, I need help with a pending task and insufficient balance. Required deposit: USDT ${computedRequiredDeposit.toFixed(2)}. Please advise.`
            : null
        }
      />
    </div>
  );
}
