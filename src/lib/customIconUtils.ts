export function isCustomIconValue(value: string | null | undefined): boolean {
  if (!value) return false;
  return value.startsWith('data:') || value.startsWith('http');
}

export function generateIconId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
