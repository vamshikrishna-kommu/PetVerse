/**
 * Shared date utility functions used across the API.
 * Using plain JS Date math to avoid adding a heavyweight dependency.
 */

/**
 * Returns the number of whole days between two dates (a - b).
 * Positive if a > b.
 */
export function differenceInDays(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((a.getTime() - b.getTime()) / msPerDay);
}

/**
 * Returns true if the given ISO date string is in the past.
 */
export function isPast(isoDate: string): boolean {
  return new Date(isoDate) < new Date();
}

/**
 * Returns an ISO date string N days from now.
 */
export function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/**
 * Returns YYYY-MM-DD string for the current date.
 */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}
