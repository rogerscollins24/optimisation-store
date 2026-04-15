export type VipLevelConfig = {
  level: number;
  commission_rate: number;
  combo_rate: number;
  activation_amount: number;
  tasks_per_set: number;
};

const DEFAULT_VIP_LEVELS: VipLevelConfig[] = [
  { level: 1, commission_rate: 2, combo_rate: 9, activation_amount: 100, tasks_per_set: 40 },
  { level: 2, commission_rate: 3, combo_rate: 12, activation_amount: 200, tasks_per_set: 45 },
  { level: 3, commission_rate: 5, combo_rate: 15, activation_amount: 500, tasks_per_set: 50 },
  { level: 4, commission_rate: 8, combo_rate: 18, activation_amount: 1000, tasks_per_set: 55 },
];

export function getDefaultVipLevels(): VipLevelConfig[] {
  return DEFAULT_VIP_LEVELS.map((item) => ({ ...item }));
}

export async function fetchVipLevels(): Promise<VipLevelConfig[]> {
  try {
    const response = await fetch('/api/vip-levels');
    if (!response.ok) {
      return getDefaultVipLevels();
    }

    const payload = await response.json();
    if (!Array.isArray(payload)) {
      return getDefaultVipLevels();
    }

    const normalized = payload
      .filter((item) => Number.isFinite(Number(item?.level)))
      .map((item) => ({
        level: Number(item.level),
        commission_rate: Number(item.commission_rate),
        combo_rate: Number(item.combo_rate),
        activation_amount: Number(item.activation_amount),
        tasks_per_set: Number(item.tasks_per_set),
      }))
      .filter((item) => Number.isFinite(item.level))
      .sort((a, b) => a.level - b.level);

    if (normalized.length === 0) {
      return getDefaultVipLevels();
    }

    return normalized;
  } catch {
    return getDefaultVipLevels();
  }
}

export function findVipLevelConfig(level: number, allLevels: VipLevelConfig[]): VipLevelConfig {
  return allLevels.find((item) => item.level === level) ?? getDefaultVipLevels()[0];
}
