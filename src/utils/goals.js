// Daily word count tracking, stored per novel.

const todayKey = () => new Date().toISOString().slice(0, 10);

// Records today's total word count for a novel and returns updated history.
export function recordProgress(history = {}, totalWords) {
  const key = todayKey();
  const next = { ...history };
  if (next[key] === undefined) {
    // First entry today: remember where the day started.
    next[key] = { start: totalWords, end: totalWords };
  } else {
    next[key] = { ...next[key], end: totalWords };
  }
  return next;
}

export function wordsToday(history = {}) {
  const day = history[todayKey()];
  if (!day) return 0;
  return Math.max(0, day.end - day.start);
}

// Consecutive days ending today (or yesterday) that hit the goal.
export function streak(history = {}, goal = 500) {
  if (!goal) return 0;
  let count = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const key = d.toISOString().slice(0, 10);
    const day = history[key];
    const written = day ? Math.max(0, day.end - day.start) : 0;
    if (written >= goal) {
      count += 1;
    } else if (i > 0 || written === 0) {
      break;
    }
    d.setDate(d.getDate() - 1);
  }
  return count;
}
