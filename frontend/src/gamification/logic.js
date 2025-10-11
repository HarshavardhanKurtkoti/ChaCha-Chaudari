// Pure gamification helpers for unit tests and reuse

export const BADGE_RULES = [
  { id: 'seedling', threshold: 25 },
  { id: 'streamkeeper', threshold: 75 },
  { id: 'river-guardian', threshold: 150 },
];

export const ACHIEVEMENTS = {
  FIRST_QUIZ: 'first-quiz',
  FIRST_TRASH: 'first-trash',
  STREAK_3: 'streak-3',
  STREAK_7: 'streak-7',
};

export function applyBadgeUnlocks(progress) {
  const unlocked = new Set(progress.badges || []);
  for (const rule of BADGE_RULES) {
    if (progress.points >= rule.threshold) unlocked.add(rule.id);
  }
  return { ...progress, badges: Array.from(unlocked) };
}

export function updateStreak(prev, todayStr) {
  const today = new Date(todayStr);
  if (!prev.lastPlayDate) {
    return { ...prev, lastPlayDate: todayStr, streak: 1 };
  }
  const last = new Date(prev.lastPlayDate);
  const dayDiff = Math.round((today - last) / (1000 * 60 * 60 * 24));
  let newStreak = prev.streak || 0;
  if (dayDiff === 1) newStreak += 1;
  else if (dayDiff !== 0) newStreak = 1; // reset if more than a day gap
  return { ...prev, lastPlayDate: todayStr, streak: newStreak };
}

export function multiplierForStreak(streak) {
  // 10% per day up to 50% (1.5x)
  return Math.min(1 + (streak * 0.1), 1.5);
}

export function addPoints(prev, basePts, meta = {}) {
  const mult = multiplierForStreak(prev.streak || 0);
  const delta = Math.round(basePts * mult);
  const next = { ...prev, points: (prev.points || 0) + delta, gamesPlayed: (prev.gamesPlayed || 0) + 1 };
  // Achievement triggers
  if (meta.mission === 'quiz' && meta.event === 'completed') {
    next.achievements = uniquePush(next.achievements, ACHIEVEMENTS.FIRST_QUIZ);
  }
  if (meta.mission === 'trash' && meta.event === 'progress') {
    next.achievements = uniquePush(next.achievements, ACHIEVEMENTS.FIRST_TRASH);
  }
  return next;
}

export function applyStreakAchievements(prev) {
  let next = { ...prev };
  if (next.streak === 3) next.achievements = uniquePush(next.achievements, ACHIEVEMENTS.STREAK_3);
  if (next.streak === 7) next.achievements = uniquePush(next.achievements, ACHIEVEMENTS.STREAK_7);
  return next;
}

function uniquePush(arr = [], id) {
  const set = new Set(arr);
  set.add(id);
  return Array.from(set);
}
