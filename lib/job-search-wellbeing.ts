export type WeeklyJobActivity = {
  weekKey: string;
  jobsViewed: number;
  applicationsSent: number;
  skillMatches: number;
  appliedBaseline: number;
  matchesBaseline: number;
  activeDates: string[];
};

export function getWeekKey(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function getDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function isWeekend(date = new Date()): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function hasWeeklyActivity(activity: WeeklyJobActivity): boolean {
  return (
    activity.jobsViewed > 0 ||
    activity.applicationsSent > 0 ||
    activity.skillMatches > 0
  );
}

export function getActiveDayCount(activity: WeeklyJobActivity): number {
  return activity.activeDates.length;
}

export function getMotivationalMessage(
  activity: WeeklyJobActivity,
  now = new Date(),
): string {
  if (isWeekend(now) && !hasWeeklyActivity(activity)) {
    return "Rest day — you deserve it 💙";
  }

  if (activity.applicationsSent >= 5) {
    return "5 applications out! Your future self thanks you.";
  }

  if (activity.applicationsSent === 1) {
    return "First application sent! The journey begins 🚀";
  }

  if (getActiveDayCount(activity) >= 3) {
    return "3 days of active searching — you're consistent!";
  }

  if (activity.jobsViewed >= 10 || activity.applicationsSent >= 2) {
    return "You're in the top 15% of active job seekers";
  }

  const dailyMessages = [
    "Great start! Keep the momentum going.",
    "Small steps add up — you're doing great.",
    "Consistency beats intensity. Keep showing up.",
    "Midweek momentum — stay curious.",
    "You're building real progress this week.",
    "Weekend recharge fuels Monday wins.",
    "Rest day — you deserve it 💙",
  ];

  return dailyMessages[now.getDay()];
}

export function shouldShowWellbeingCard(
  activity: WeeklyJobActivity,
  now = new Date(),
): boolean {
  if (hasWeeklyActivity(activity)) return true;
  return isWeekend(now);
}

export function createEmptyWeekActivity(weekKey: string): WeeklyJobActivity {
  return {
    weekKey,
    jobsViewed: 0,
    applicationsSent: 0,
    skillMatches: 0,
    appliedBaseline: 0,
    matchesBaseline: 0,
    activeDates: [],
  };
}
