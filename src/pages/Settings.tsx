import { useState, useEffect } from 'react';
import { Save, ShieldAlert, Globe } from 'lucide-react';

type SettingsMap = Record<string, string>;

const defaults: SettingsMap = {
  maintenance_mode: 'false',
  global_withdrawal_lock: 'false',
  require_withdrawal_pin: 'true',
  platform_name: 'Task-Commission Platform',
  support_email: 'support@example.com',
  minimum_withdrawal: '50',
  maximum_withdrawal: '10000',
  withdrawal_fee_percent: '2',
  minimum_deposit: '20',
  maximum_deposit: '50000',
  default_currency: 'USD',
  telegram_link: 'https://t.me/group',
  whatsapp_link: 'https://wa.me/00000000000',
  lock_all_user_activities: 'false',
};

export default function Settings() {
  const [settings, setSettings] = useState<SettingsMap>(defaults);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const res = await fetch('/api/settings');
    const data = await res.json();
    const next = { ...defaults };
    if (Array.isArray(data)) {
      data.forEach((item: any) => {
        next[item.key] = item.value;
      });
    }
    setSettings(next);
  };

  const setValue = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const payload = {
      settings: Object.entries(settings).map(([key, value]) => ({ key, value })),
    };

    await fetch('/api/settings/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    alert('Settings saved successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Platform Settings</h1>
          <p className="text-sm text-slate-400 mt-1">Configure global platform behavior and security controls.</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors w-fit"
        >
          <Save size={18} />
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <ShieldAlert className="text-rose-400" size={20} />
            <h2 className="text-lg font-semibold text-slate-100">Critical Security Controls</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
              <span className="text-sm text-slate-200">Maintenance Mode</span>
              <input type="checkbox" checked={settings.maintenance_mode === 'true'} onChange={(e) => setValue('maintenance_mode', String(e.target.checked))} />
            </label>
            <label className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
              <span className="text-sm text-slate-200">Global Withdrawal Lock</span>
              <input type="checkbox" checked={settings.global_withdrawal_lock === 'true'} onChange={(e) => setValue('global_withdrawal_lock', String(e.target.checked))} />
            </label>
            <label className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
              <span className="text-sm text-slate-200">Require Withdrawal PIN</span>
              <input type="checkbox" checked={settings.require_withdrawal_pin === 'true'} onChange={(e) => setValue('require_withdrawal_pin', String(e.target.checked))} />
            </label>
            <label className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
              <span className="text-sm text-slate-200">Lock All User Activities</span>
              <input type="checkbox" checked={settings.lock_all_user_activities === 'true'} onChange={(e) => setValue('lock_all_user_activities', String(e.target.checked))} />
            </label>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Globe className="text-blue-400" size={20} />
            <h2 className="text-lg font-semibold text-slate-100">General Configuration</h2>
          </div>

          <div className="space-y-4">
            <input value={settings.platform_name} onChange={(e) => setValue('platform_name', e.target.value)} placeholder="Platform Name" className="w-full bg-slate-900/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg p-2.5 outline-none" />
            <input value={settings.support_email} onChange={(e) => setValue('support_email', e.target.value)} placeholder="Support Email" className="w-full bg-slate-900/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg p-2.5 outline-none" />
            <input value={settings.minimum_withdrawal} onChange={(e) => setValue('minimum_withdrawal', e.target.value)} placeholder="Minimum Withdrawal" className="w-full bg-slate-900/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg p-2.5 outline-none" />
            <input value={settings.maximum_withdrawal} onChange={(e) => setValue('maximum_withdrawal', e.target.value)} placeholder="Maximum Withdrawal" className="w-full bg-slate-900/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg p-2.5 outline-none" />
            <input value={settings.withdrawal_fee_percent} onChange={(e) => setValue('withdrawal_fee_percent', e.target.value)} placeholder="Withdrawal Fee %" className="w-full bg-slate-900/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg p-2.5 outline-none" />
            <input value={settings.minimum_deposit} onChange={(e) => setValue('minimum_deposit', e.target.value)} placeholder="Minimum Deposit" className="w-full bg-slate-900/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg p-2.5 outline-none" />
            <input value={settings.maximum_deposit} onChange={(e) => setValue('maximum_deposit', e.target.value)} placeholder="Maximum Deposit" className="w-full bg-slate-900/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg p-2.5 outline-none" />
            <select value={settings.default_currency} onChange={(e) => setValue('default_currency', e.target.value)} className="w-full bg-slate-900/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg p-2.5 outline-none">
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="USDT">USDT</option>
            </select>
            <input value={settings.telegram_link} onChange={(e) => setValue('telegram_link', e.target.value)} placeholder="Telegram Link" className="w-full bg-slate-900/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg p-2.5 outline-none" />
            <input value={settings.whatsapp_link} onChange={(e) => setValue('whatsapp_link', e.target.value)} placeholder="WhatsApp Link" className="w-full bg-slate-900/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg p-2.5 outline-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
