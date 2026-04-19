import { useEffect, useMemo, useState } from 'react';
import { Bell, UserCircle, Star, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUser, Task } from '../store';
import { useAuth } from '../context/AuthContext';
import ChatModal from '../components/ChatModal';
import { useDynamicTranslations } from '../hooks/useDynamicTranslations';
import { fetchVipLevels, findVipLevelConfig, getDefaultVipLevels, type VipLevelConfig } from '../lib/vipApi';

interface Product {
  id: number;
  name: string;
  price: number;
  image_url?: string | null;
}

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

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export default function Starting() {
  const { user, refreshUser, setUser } = useAuth();
  const { t } = useTranslation();
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
  const [vipLevels, setVipLevels] = useState<VipLevelConfig[]>(() => getDefaultVipLevels());
  const isAccountActive = user?.status === 'Active';
  const currentVip = user ? findVipLevelConfig(user.vip_level, vipLevels) : null;
  const totalTasks = currentVip ? currentVip.tasks_per_set : 40;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const data = await fetchVipLevels();
      if (mounted) {
        setVipLevels(data);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

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
    return { message: t('requestFailed') };
  };

  const handleStart = async () => {
    if (!user) return;
    if (!isAccountActive) {
      alert('Account not active. Contact support.');
      setChatSignal((prev) => prev + 1);
      return;
    }
    if (user.tasks_completed_in_set >= totalTasks) {
      alert(t('completedAllTasks'));
      return;
    }

    setIsOptimizing(true);
    try {
      const revealDelay = 3000 + Math.floor(Math.random() * 3001);
      const [response] = await Promise.all([
        fetch('/api/tasks/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            currentTaskNumber: (user.tasks_completed_in_set ?? 0) + 1,
          }),
        }),
        wait(revealDelay),
      ]);
      if (!response.ok) {
        const error = await parseError(response);
        if (error.task) {
          setCurrentTask(mapTaskRecord(error.task));
          setPendingTaskBlocked(true);
          setSupportUrl(typeof error.supportUrl === 'string' && error.supportUrl ? error.supportUrl : 'https://t.me/');
          return;
        }
        throw new Error(error.message || t('taskFailed'));
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
      alert(error instanceof Error ? error.message : t('unableToStartTask'));
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSubmitTask = async () => {
    if (!currentTask) return;
    if (!user) return;
    if (!isAccountActive) {
      alert('Account not active. Contact support.');
      setChatSignal((prev) => prev + 1);
      return;
    }

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
        throw new Error(error.message || t('submitFailed'));
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
      alert(error instanceof Error ? error.message : t('unableToSubmitTask'));
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

  const dynamicTexts = useMemo(() => {
    const texts: string[] = [];

    pendingTasks.forEach((task) => {
      if (task.title) texts.push(task.title);
      task.products?.forEach((item) => {
        const name = String(item.product_name || '').trim();
        if (name) texts.push(name);
      });
    });

    if (currentTask?.title) {
      texts.push(currentTask.title);
      currentTask.products?.forEach((item) => {
        const name = String(item.product_name || '').trim();
        if (name) texts.push(name);
      });
    }

    productCells.forEach((product) => {
      if (product?.name) texts.push(product.name);
    });

    return texts;
  }, [currentTask, pendingTasks, productCells]);

  const { translateText } = useDynamicTranslations(dynamicTexts);

  return (
    <div className="client-page relative flex min-h-full flex-col pb-6">
      <div className="client-header flex items-center justify-between rounded-xl p-3 sm:p-4 shadow-sm md:p-5">
        <h1 className="text-lg font-bold text-[#f5eee2] sm:text-xl">{t('brandName')}</h1>
        <div className="flex items-center gap-3 sm:gap-4">
          <Bell className="text-zinc-300" size={24} />
          <Link to="/profile">
            <UserCircle className="text-zinc-300" size={28} />
          </Link>
        </div>
      </div>

      <div className="p-3 sm:p-4 md:p-6">
        <div className="mx-auto w-full max-w-6xl">
        <div className="mb-5 flex items-center gap-2.5 sm:mb-6 sm:gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <span className="text-2xl">👋</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#3a2f24] sm:text-xl">{t('welcomeBack', { name: user?.username ?? t('guest') })}</h2>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-bold text-yellow-800">{t('vipBadge', { level: user?.vip_level ?? 1 })}</span>
            </div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="client-card-dark rounded-xl p-4 shadow-md">
            <p className="mb-1 text-sm opacity-80">{t('totalBalance')}</p>
            <p className="text-xl font-bold">{(user?.balance ?? 0).toFixed(2)} <span className="text-sm font-normal">USDT</span></p>
          </div>
          <div className="client-card-dark rounded-xl p-4 shadow-md">
            <p className="mb-1 text-sm opacity-80">{t('commissionToday')}</p>
            <p className="text-xl font-bold">{(user?.commission_today ?? 0).toFixed(2)} <span className="text-sm font-normal">USDT</span></p>
          </div>
          <div className="client-card hidden min-h-[132px] flex-col justify-center rounded-xl p-4 sm:flex md:p-5">
            <p className="text-sm font-semibold text-[#645342]">{t('taskProgress')}</p>
            <p className="mt-3 text-3xl font-bold leading-none text-amber-700 sm:text-4xl">{user?.tasks_completed_in_set ?? 0}<span className="text-xl text-[#6f5e4c] sm:text-2xl">/{totalTasks}</span></p>
          </div>
        </div>

        <div className="mb-4 flex justify-between items-center">
          <h3 className="font-bold text-[#3c3025]">{t('startOptimization')}</h3>
          <span className="rounded-full bg-[#e6d4bb] px-3 py-1 text-sm text-[#6e5d4b]">
            {user?.tasks_completed_in_set ?? 0}/{totalTasks}
          </span>
        </div>

        <div className="mx-auto max-w-[1200px] rounded-2xl p-1.5 sm:p-2 md:p-4">
          <div className="grid grid-cols-3 justify-items-center gap-2 sm:gap-4 md:gap-5">
            {productCells.map((product, cellIndex) => {
              if (cellIndex === 4) {
                return (
                  <div key="start-cell" className="aspect-square w-full max-w-[112px] min-[420px]:max-w-[140px] sm:max-w-[180px] md:max-w-[205px] lg:max-w-[225px]">
                    <button
                      onClick={handleStart}
                      disabled={isOptimizing || pendingTaskBlocked || (user?.tasks_completed_in_set ?? 0) >= totalTasks || !isAccountActive}
                      className={`mx-auto flex h-full w-full flex-col items-center justify-center rounded-full text-center text-white font-bold text-sm shadow-2xl transition-transform active:scale-95 sm:text-lg ${
                        (isOptimizing || pendingTaskBlocked || (user?.tasks_completed_in_set ?? 0) >= totalTasks || !isAccountActive)
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-[linear-gradient(100deg,#9f6a2a_0%,#be8a43_52%,#986225_100%)] hover:brightness-105'
                      }`}
                    >
                      {isOptimizing ? (
                        <div className="mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-white"></div>
                      ) : (
                        <span className="mb-1 text-3xl sm:mb-2 sm:text-4xl">🚀</span>
                      )}
                      <span>{isOptimizing ? t('optimizing') : pendingTaskBlocked ? t('pending') : t('start')}</span>
                    </button>
                  </div>
                );
              }

              return (
                <div key={`product-cell-${cellIndex}`} className="aspect-square w-full max-w-[112px] min-[420px]:max-w-[140px] sm:max-w-[180px] md:max-w-[205px] lg:max-w-[225px] overflow-hidden rounded-2xl border border-[#d9c8b0] bg-[#f6ede0] shadow-sm">
                  {product ? (
                    <img
                      src={product.image_url || 'https://picsum.photos/seed/default/300/300'}
                      alt={translateText(product.name)}
                      className="h-full w-full object-cover transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#efe2cf] text-[10px] font-medium uppercase tracking-[0.12em] text-[#8d7c68] sm:text-xs sm:tracking-[0.2em]">
                      {t('waiting')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {pendingTaskBlocked && !currentTask && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            {t('pendingTaskWarning')}
            <button onClick={() => window.location.reload()} className="ml-2 underline font-medium">
              {t('resumePendingTask')}
            </button>
          </div>
        )}

        <div className="client-card mt-6 rounded-xl p-4 md:p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#3b3025]">{t('pendingSection')}</h3>
            <span className="rounded-full bg-[#ead8bc] px-3 py-1 text-xs font-semibold text-[#6f542e]">
              {pendingTasks.length} {t('activeLabel')}
            </span>
          </div>

          {pendingTasks.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-[#d8c8b2] bg-[#f5ebdd] px-4 py-6 text-sm text-[#7a6855]">
              {t('noPendingTasks')}
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {pendingTasks.map((task) => (
                <div key={task.taskCode} className="rounded-xl border border-[#d8c8b2] bg-white/65 p-3 sm:p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <img src={task.image} alt={task.title} className="h-20 w-20 rounded-xl object-cover bg-[#f1e6d5]" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h4 className="line-clamp-2 font-semibold text-[#3a2f24]">{translateText(task.title)}</h4>
                          <p className="mt-1 text-xs text-[#7a6955]">{new Date(task.createdAt).toLocaleString()}</p>
                        </div>
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          task.status === 'pending_debited' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {task.status === 'pending_debited' ? t('pendingDeposit') : t('pending')}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                        <div className="rounded-lg bg-[#f3e8d9] px-3 py-2">
                          <p className="text-xs text-[#7a6955]">{t('amountLabel')}</p>
                          <p className="font-semibold text-[#3a2f24]">USDT {task.price.toFixed(2)}</p>
                        </div>
                        <div className="rounded-lg bg-[#f3e8d9] px-3 py-2">
                          <p className="text-xs text-[#7a6955]">{t('commissionLabel')}</p>
                          <p className="font-semibold text-emerald-600">USDT {task.commission.toFixed(2)}</p>
                        </div>
                        <div className="col-span-2 rounded-lg bg-[#f3e8d9] px-3 py-2 sm:col-span-1">
                          <p className="text-xs text-[#7a6955]">{t('taskCode')}</p>
                          <p className="font-mono text-xs font-semibold text-[#3a2f24]">{task.taskCode}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          onClick={() => {
                            setCurrentTask(task);
                            setPendingTaskBlocked(true);
                          }}
                          className="client-btn-primary rounded-lg px-4 py-2 text-sm font-semibold"
                        >
                          {t('resumeTask')}
                        </button>
                        {task.status === 'pending_debited' && (
                          <Link to="/deposit" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                            {t('depositFunds')}
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
    </div>

      {currentTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-[#f0e5d6] shadow-2xl">
            <div className="client-header flex items-center justify-between p-4 text-white">
              <h3 className="font-bold text-lg">{t('taskSubmission')}</h3>
              <button onClick={handleCloseModal} className="text-white/80 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="p-4 sm:p-6 md:p-8">
              <div className="mb-6 grid gap-6 md:grid-cols-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <img src={currentTask.image} alt={t('productAlt')} className="h-20 w-20 rounded-lg object-cover shadow-sm sm:h-24 sm:w-24" />
                <div>
                  <h4 className="mb-2 line-clamp-2 font-medium text-[#3a2f24]">{translateText(currentTask.title)}</h4>
                  <p className="font-bold text-amber-700">USDT {currentTask.price.toFixed(2)}</p>
                  <div className="flex text-yellow-400 mt-1">
                    {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                  </div>
                </div>
                </div>

                <div>
                  {currentTask.isCombo && currentTask.products && currentTask.products.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {currentTask.products.map((item) => (
                        <div key={item.product_id} className="flex items-center justify-between rounded-lg border border-[#dbc9b0] bg-[#f3e8d8] px-3 py-2 text-sm">
                          <span className="text-[#5a4b3c]">{translateText(item.product_name)}</span>
                          <span className="font-semibold text-amber-700">USDT {Number(item.price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-3 rounded-xl border border-[#dbc9b0] bg-[#f6ede0] p-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#786754]">{t('totalAmount')}</span>
                      <span className="font-bold text-[#3a2f24]">USDT {currentTask.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#786754]">{t('commissionLabel')}</span>
                      <span className="font-bold text-green-600">USDT {currentTask.commission.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#786754]">{t('createdAt')}</span>
                      <span className="text-[#3a2f24]">{new Date(currentTask.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#786754]">{t('taskCode')}</span>
                      <span className="font-mono text-[#3a2f24]">{currentTask.taskCode}</span>
                    </div>
                  </div>
                </div>
              </div>

              {hasDepositWarning && (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 space-y-2">
                  <p className="font-semibold">{t('insufficientBalanceDeposit')}</p>
                  <p>{t('requiredDeposit')}: USDT {computedRequiredDeposit.toFixed(2)}</p>
                  <div>
                    <label className="block text-xs text-rose-600 mb-1">{t('depositAmount')}</label>
                    <input
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-gray-800"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                    <Link to="/deposit" className="text-blue-600 underline font-medium">{t('goToDeposit')}</Link>
                    <button
                      onClick={() => setChatSignal((prev) => prev + 1)}
                      className="text-amber-700 underline font-medium"
                    >
                      {t('contactSupportChat')}
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleSubmitTask}
                disabled={isSubmitting || !isAccountActive}
                className="client-btn-primary w-full rounded-xl py-3 font-bold transition-colors shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? t('submitting') : t('submit')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ChatModal
        token={supportToken}
        openSignal={chatSignal}
        presetSubject={t('balanceIssueSubject')}
        presetMessage={
          hasDepositWarning
            ? t('balanceIssueMessage', { amount: computedRequiredDeposit.toFixed(2) })
            : null
        }
      />
    </div>
  );
}
