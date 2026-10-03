import cron from 'node-cron';

/**
 * Checks whether a numeric field (minute, hour, day, month, dayOfWeek) matches
 * a standard cron pattern component (e.g. "*", "5", "1-5", "* /15", "1,15,30").
 */
export function matchCronField(val: number, pattern: string): boolean {
  if (pattern === '*') return true;
  const parts = pattern.split(',');
  for (const part of parts) {
    if (part.includes('/')) {
      const [range, stepStr] = part.split('/');
      const step = parseInt(stepStr, 10);
      if (isNaN(step) || step <= 0) continue;
      const start = range === '*' ? 0 : parseInt(range, 10);
      if ((val - start) % step === 0 && val >= start) return true;
    } else if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number);
      if (val >= start && val <= end) return true;
    } else if (parseInt(part, 10) === val) {
      return true;
    }
  }
  return false;
}

/**
 * Calculates the next trigger timestamp for a standard 5-part cron expression
 * from a given starting date.
 */
export function getNextCronTrigger(cronExpression: string, fromDate: Date = new Date()): Date | null {
  if (!cronExpression || !cron.validate(cronExpression.trim())) {
    return null;
  }

  const parts = cronExpression.trim().split(/\s+/);
  if (parts.length < 5) return null;
  const [minP, hourP, domP, monP, dowP] = parts;

  const next = new Date(fromDate.getTime());
  next.setSeconds(0, 0);
  next.setMinutes(next.getMinutes() + 1);

  // Search forward up to 1 year (525,600 minutes)
  for (let i = 0; i < 525600; i++) {
    const min = next.getMinutes();
    const hour = next.getHours();
    const dom = next.getDate();
    const mon = next.getMonth() + 1;
    const dow = next.getDay();

    if (
      matchCronField(min, minP) &&
      matchCronField(hour, hourP) &&
      matchCronField(dom, domP) &&
      matchCronField(mon, monP) &&
      matchCronField(dow, dowP)
    ) {
      return next;
    }
    next.setMinutes(next.getMinutes() + 1);
  }

  return null;
}
