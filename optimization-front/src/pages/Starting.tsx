import { useEffect, useMemo, useState } from 'react';
import { Bell, UserCircle, Star, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUser, Task } from '../store';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import ChatModal from '../components/ChatModal';
import { useDynamicTranslations } from '../hooks/useDynamicTranslations';
import { formatLocalizedDateTime } from '../lib/dateFormatting';
import { fetchVipLevels, findVipLevelConfig, getDefaultVipLevels, type VipLevelConfig } from '../lib/vipApi';
import { BrandHomeIcon } from '../components/BrandIcons';

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
const DISPLAY = '"Bricolage Grotesque", ui-sans-serif';

export default function Starting() {
  const { user, refreshUser, setUser } = useAuth();
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const { theme } = useTheme();
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
      showToast(t('accountNotActiveAlert'), 'warning');
      setChatSignal((prev) => prev + 1);
      return;
    }
    if (user.tasks_completed_in_set >= totalTasks) {
      showToast(t('completedAllTasks'), 'info');
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
      showToast(error instanceof Error ? error.message : t('unableToStartTask'), 'error');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSubmitTask = async () => {
    if (!currentTask) return;
    if (!user) return;
    if (!isAccountActive) {
      showToast(t('accountNotActiveAlert'), 'warning');
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
      showToast(error instanceof Error ? error.message : t('unableToSubmitTask'), 'error');
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
  const locale = i18n.resolvedLanguage || i18n.language || 'en';
  const isDark = theme === 'dark';

  return (
    <div className="canvas-texture relative flex min-h-full flex-col pb-6">
      <div
        className="overflow-hidden rounded-[28px] border p-4 shadow-[0_18px_36px_rgba(28,26,23,0.08)] md:p-5"
        style={{
          background: isDark
            ? 'linear-gradient(145deg, rgba(37,31,24,0.96) 0%, rgba(25,22,18,0.98) 100%)'
            : 'linear-gradient(145deg, rgba(250,248,244,0.97) 0%, rgba(242,236,226,0.98) 100%)',
          borderColor: isDark ? 'rgba(120,103,82,0.35)' : 'rgba(196,178,154,0.35)',
        }}
      >
        <div className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.26em]"
          style={{ background: isDark ? 'rgba(212,188,148,0.12)' : 'rgba(180,83,9,0.08)', color: isDark ? '#d4bc94' : '#8a4b12', fontFamily: DISPLAY }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#b45309' }} />
          {t('startOptimization')}
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: isDark ? 'rgba(212,188,148,0.1)' : 'rgba(180,83,9,0.1)', border: isDark ? '1px solid rgba(212,188,148,0.14)' : '1px solid rgba(180,83,9,0.16)' }}>
              <BrandHomeIcon size={20} style={{ color: '#b45309' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100" style={{ fontFamily: DISPLAY, fontWeight: 700 }}>{t('brandName')}</h1>
              <p className="text-sm font-medium" style={{ color: isDark ? '#b8afa4' : '#6b6560' }}>{t('welcomeBack', { name: user?.username ?? t('guest') })}</p>
            </div>
          </div>
        <div className="flex items-center gap-4">
          <Bell className="text-stone-500 dark:text-stone-400" size={22} />
          <Link to="/profile">
            <UserCircle className="text-stone-500 dark:text-stone-400" size={28} />
          </Link>
        </div>
        </div>
      </div>

      <div className="p-4 md:p-6">
        <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'rgba(180,83,9,0.12)' }}>
            <span className="text-2xl">👋</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100" style={{ fontFamily: DISPLAY }}>{t('welcomeBack', { name: user?.username ?? t('guest') })}</h2>
            <div className="flex items-center gap-2">
              <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: 'rgba(180,83,9,0.12)', color: '#8a4b12' }}>{t('vipBadge', { level: user?.vip_level ?? 1 })}</span>
            </div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-3xl border p-4 shadow-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <p className="mb-1 text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: isDark ? '#9e9385' : '#9c9288', fontFamily: DISPLAY }}>{t('totalBalance')}</p>
            <p className="text-2xl font-bold text-stone-900 dark:text-stone-100" style={{ fontFamily: DISPLAY }}>{(user?.balance ?? 0).toFixed(2)} <span className="text-sm font-medium text-stone-500 dark:text-stone-400">USDT</span></p>
          </div>
          <div className="rounded-3xl border p-4 shadow-sm" style={{ background: isDark ? 'linear-gradient(160deg, rgba(180,83,9,0.18) 0%, rgba(120,74,30,0.14) 100%)' : 'linear-gradient(160deg, rgba(180,83,9,0.12) 0%, rgba(180,83,9,0.06) 100%)', borderColor: isDark ? 'rgba(180,83,9,0.24)' : 'rgba(180,83,9,0.18)' }}>
            <p className="mb-1 text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: isDark ? '#e8c48f' : '#8a4b12', fontFamily: DISPLAY }}>{t('commissionToday')}</p>
            <p className="text-2xl font-bold text-stone-900 dark:text-stone-100" style={{ fontFamily: DISPLAY }}>{(user?.commission_today ?? 0).toFixed(2)} <span className="text-sm font-medium text-stone-500 dark:text-stone-400">USDT</span></p>
          </div>
          <div className="flex min-h-33 flex-col justify-center rounded-3xl border border-[#ddd1c3] bg-[#231d17] p-4 shadow-sm md:p-5 dark:border-[#4b4032]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-300/75" style={{ fontFamily: DISPLAY }}>{t('taskProgress')}</p>
            <p className="mt-3 text-4xl font-bold leading-none text-amber-300" style={{ fontFamily: DISPLAY }}>{user?.tasks_completed_in_set ?? 0}<span className="text-2xl text-stone-500">/{totalTasks}</span></p>
          </div>
        </div>

        <div className="mb-4 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 dark:text-gray-100">{t('startOptimization')}</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-zinc-700 px-3 py-1 rounded-full">
            {user?.tasks_completed_in_set ?? 0}/{totalTasks}
          </span>
        </div>

        <div className="mx-auto max-w-260 rounded-2xl p-2 md:p-4">
          <div className="grid grid-cols-3 justify-items-center gap-3 sm:gap-4 md:gap-5">
            {productCells.map((product, cellIndex) => {
              if (cellIndex === 4) {
                return (
                  <div key="start-cell" className="aspect-square w-full max-w-45">
                    <button
                      onClick={handleStart}
                      disabled={isOptimizing || pendingTaskBlocked || (user?.tasks_completed_in_set ?? 0) >= totalTasks || !isAccountActive}
                      className={`mx-auto flex h-full w-full flex-col items-center justify-center rounded-full text-center text-white font-bold text-lg shadow-2xl transition-transform active:scale-95 ${
                        (isOptimizing || pendingTaskBlocked || (user?.tasks_completed_in_set ?? 0) >= totalTasks || !isAccountActive)
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                      }`}
                    >
                      {isOptimizing ? (
                        <div className="mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-white"></div>
                      ) : (
                        <span className="mb-2 text-4xl">🚀</span>
                      )}
                      <span>{isOptimizing ? t('optimizing') : pendingTaskBlocked ? t('pending') : t('start')}</span>
                    </button>
                  </div>
                );
              }

              return (
                <div key={`product-cell-${cellIndex}`} className="aspect-square w-full max-w-45 overflow-hidden rounded-2xl border border-slate-100 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 shadow-sm">
                  {product ? (
                    <img
                      src={product.image_url || `https://picsum.photos/seed/product-${product.id}/300/300`}
                      alt={translateText(product.name)}
                      className="h-full w-full object-cover transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-zinc-700 text-xs font-medium uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">
                      {t('waiting')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {pendingTaskBlocked && !currentTask && (
          <div className="mt-4 rounded-xl border border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-950/40 p-3 text-sm text-amber-700 dark:text-amber-300">
            {t('pendingTaskWarning')}
            <button onClick={() => window.location.reload()} className="ml-2 underline font-medium">
              {t('resumePendingTask')}
            </button>
          </div>
        )}

          <div className="mt-6 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 shadow-sm md:p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{t('pendingSection')}</h3>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              {pendingTasks.length} {t('activeLabel')}
            </span>
          </div>

          {pendingTasks.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-200 dark:border-zinc-600 bg-slate-50 dark:bg-zinc-800 px-4 py-6 text-sm text-slate-500 dark:text-slate-400">
              {t('noPendingTasks')}
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {pendingTasks.map((task) => (
                <div key={task.taskCode} className="rounded-xl border border-slate-200 dark:border-zinc-700 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <img src={task.image} alt={task.title} className="h-20 w-20 rounded-xl object-cover bg-slate-100" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h4 className="line-clamp-2 font-semibold text-slate-800 dark:text-slate-100">{translateText(task.title)}</h4>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatLocalizedDateTime(task.createdAt, locale)}</p>
                        </div>
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          task.status === 'pending_debited' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {task.status === 'pending_debited' ? t('pendingDeposit') : t('pending')}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                        <div className="rounded-lg bg-slate-50 dark:bg-zinc-800 px-3 py-2">
                          <p className="text-xs text-slate-500 dark:text-slate-400">{t('amountLabel')}</p>
                          <p className="font-semibold text-slate-800 dark:text-slate-100">USDT {task.price.toFixed(2)}</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 dark:bg-zinc-800 px-3 py-2">
                          <p className="text-xs text-slate-500 dark:text-slate-400">{t('commissionLabel')}</p>
                          <p className="font-semibold text-emerald-600 dark:text-emerald-400">USDT {task.commission.toFixed(2)}</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 dark:bg-zinc-800 px-3 py-2 col-span-2 sm:col-span-1">
                          <p className="text-xs text-slate-500 dark:text-slate-400">{t('taskCode')}</p>
                          <p className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-100">{task.taskCode}</p>
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
        <div className="fixed inset-0 bg-black/60 z-100 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl">
            <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">{t('taskSubmission')}</h3>
              <button onClick={handleCloseModal} className="text-white/80 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 md:p-8">
              <div className="mb-6 grid gap-6 md:grid-cols-2">
                <div className="flex gap-4">
                <img src={currentTask.image} alt={t('productAlt')} className="w-24 h-24 object-cover rounded-lg shadow-sm" />
                <div>
                  <h4 className="font-medium text-gray-800 line-clamp-2 mb-2">{translateText(currentTask.title)}</h4>
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
                        <div key={item.product_id} className="flex items-center justify-between text-sm rounded-lg bg-blue-50 dark:bg-blue-950/40 px-3 py-2 border border-blue-100 dark:border-blue-900/50">
                          <span className="text-gray-700 dark:text-gray-300">{translateText(item.product_name)}</span>
                          <span className="font-semibold text-blue-700">USDT {Number(item.price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-3 bg-gray-50 dark:bg-zinc-800 p-4 rounded-xl border border-gray-100 dark:border-zinc-700">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{t('totalAmount')}</span>
                      <span className="font-bold text-gray-800 dark:text-gray-100">USDT {currentTask.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{t('commissionLabel')}</span>
                      <span className="font-bold text-green-600 dark:text-green-400">USDT {currentTask.commission.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{t('createdAt')}</span>
                      <span className="text-gray-800 dark:text-gray-200">{formatLocalizedDateTime(currentTask.createdAt, locale)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{t('taskCode')}</span>
                      <span className="text-gray-800 dark:text-gray-200 font-mono">{currentTask.taskCode}</span>
                    </div>
                  </div>
                </div>
              </div>

              {hasDepositWarning && (
                <div className="mb-4 rounded-xl border border-rose-200 dark:border-rose-800/50 bg-rose-50 dark:bg-rose-950/40 p-4 text-sm text-rose-700 dark:text-rose-300 space-y-2">
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
                      className="w-full rounded-lg border border-rose-200 dark:border-rose-800/50 bg-white dark:bg-zinc-800 dark:text-gray-100 px-3 py-2 text-sm text-gray-800"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Link to="/deposit" className="text-blue-600 underline font-medium">{t('goToDeposit')}</Link>
                    <button
                      onClick={() => setChatSignal((prev) => prev + 1)}
                      className="text-blue-600 underline font-medium"
                    >
                      {t('contactSupportChat')}
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleSubmitTask}
                disabled={isSubmitting || !isAccountActive}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
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
