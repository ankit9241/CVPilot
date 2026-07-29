export const toIsoDate = (d: Date | string | null | undefined): string | null =>
  d ? new Date(d).toISOString() : null;

export const nowIso = (): string => new Date().toISOString();

export const addSeconds = (base: Date, seconds: number): Date =>
  new Date(base.getTime() + seconds * 1000);

/**
 * Calculate total years of experience from an array of experience objects.
 * Accepts any array whose items have startDate, endDate, and isCurrent fields.
 */
export function calculateYoE(experiences: Array<{
  startDate?: string | null;
  endDate?: string | null;
  isCurrent?: boolean;
}>): number {
  let totalMonths = 0;
  for (const exp of experiences) {
    const start = exp.startDate ? new Date(exp.startDate) : null;
    const end = exp.isCurrent || !exp.endDate ? new Date() : new Date(exp.endDate);
    if (start && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
      const diffMonths =
        (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      totalMonths += Math.max(0, diffMonths);
    }
  }
  return Math.round((totalMonths / 12) * 10) / 10;
}

/**
 * Infer seniority label from years of experience.
 */
export function inferSeniority(yoe: number): 'junior' | 'mid' | 'senior' | 'lead' {
  if (yoe < 2) return 'junior';
  if (yoe < 5) return 'mid';
  if (yoe < 9) return 'senior';
  return 'lead';
}

