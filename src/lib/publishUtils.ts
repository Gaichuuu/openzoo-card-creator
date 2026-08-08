export function versionedName(prefix: string, ext: string, ts: number): string {
  return `${prefix}-${ts}.${ext}`;
}

export function isMeaningfullyUpdated(createdAt: Date, updatedAt: Date): boolean {
  return updatedAt.getTime() - createdAt.getTime() > 60_000;
}
