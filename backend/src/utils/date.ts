export const toIsoDate = (d: Date | string | null | undefined): string | null =>
  d ? new Date(d).toISOString() : null;

export const nowIso = (): string => new Date().toISOString();

export const addSeconds = (base: Date, seconds: number): Date =>
  new Date(base.getTime() + seconds * 1000);
