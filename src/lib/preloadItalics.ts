let started = false;

export function preloadItalicFonts(): void {
  if (started || typeof document === 'undefined' || !document.fonts) return;
  started = true;
  for (const weight of [400, 700]) {
    document.fonts.load(`italic ${weight} 16px "EB Garamond"`).catch(() => {});
  }
}
