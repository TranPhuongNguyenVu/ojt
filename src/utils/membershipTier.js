// Ngưỡng điểm phân hạng thành viên (đồng bộ với hiển thị điểm tích lũy trên toàn app)
const TIERS = [
  {
    tier: 'Platinum',
    min: 5000,
    next: null,
    badgeColor: 'bg-red-500/10 text-[#C00000] dark:text-[#ff4d57]',
    textColor: 'text-[#C00000] dark:text-[#ff4d57]',
    iconBg: 'bg-red-500/15 text-[#C00000] dark:text-[#ff4d57]',
  },
  {
    tier: 'Gold',
    min: 2000,
    next: 'Platinum',
    nextThreshold: 5000,
    badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    textColor: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  },
  {
    tier: 'Silver',
    min: 1000,
    next: 'Gold',
    nextThreshold: 2000,
    badgeColor: 'bg-slate-300/20 text-slate-700 dark:text-slate-300',
    textColor: 'text-slate-600 dark:text-slate-300',
    iconBg: 'bg-slate-400/20 text-slate-600 dark:text-slate-300',
  },
  {
    tier: 'Standard',
    min: 0,
    next: 'Silver',
    nextThreshold: 1000,
    badgeColor: 'bg-gray-100 dark:bg-white/10 text-[#6B7280] dark:text-white/55',
    textColor: 'text-[#6B7280] dark:text-white/55',
    iconBg: 'bg-gray-200/60 dark:bg-white/10 text-[#6B7280] dark:text-white/55',
  },
];

export function getMembershipTier(score) {
  const currentPoints = score || 0;
  const matched = TIERS.find((t) => currentPoints >= t.min);

  return {
    tier: matched.tier,
    nextTier: matched.next || 'Max',
    targetPoints: matched.next ? matched.nextThreshold : currentPoints,
    badgeColor: matched.badgeColor,
    textColor: matched.textColor,
    iconBg: matched.iconBg,
    isMaxTier: matched.next === null,
  };
}
