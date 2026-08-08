export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function versionedName(prefix: string, ext: string, ts: number): string {
  return `${prefix}-${ts}.${ext}`;
}

export function isMeaningfullyUpdated(createdAt: Date, updatedAt: Date): boolean {
  return updatedAt.getTime() - createdAt.getTime() > 60_000;
}
