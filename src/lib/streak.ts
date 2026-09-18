export function trainingDate(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function shiftDate(date: string, offset: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}
export function trainingStats(dates: string[], today: string) {
  const sorted = [...new Set(dates.filter((d) => d <= today))].sort();
  const set = new Set(sorted);
  let current = 0;
  let cursor = set.has(today) ? today : shiftDate(today, -1);
  while (set.has(cursor)) {
    current++;
    cursor = shiftDate(cursor, -1);
  }
  let longest = 0,
    run = 0;
  sorted.forEach((date, i) => {
    run = i > 0 && shiftDate(sorted[i - 1], 1) === date ? run + 1 : 1;
    longest = Math.max(longest, run);
  });
  const day = new Date(`${today}T12:00:00Z`).getUTCDay();
  const monday = shiftDate(today, -(day + 6) % 7);
  const week = sorted.filter((d) => d >= monday).length;
  return { current, longest, total: sorted.length, week, monday };
}
