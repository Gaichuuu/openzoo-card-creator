import { useCardStore } from '@/lib/store';
import { downloadBlob, sanitizeCardNameForFilename } from '@/lib/exportUtils';

export function JsonExportButton() {
  const getSnapshot = useCardStore((s) => s.getSnapshot);
  const cardName = useCardStore((s) => s.cardName);

  function handleExport() {
    const snapshot = getSnapshot();
    const json = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    downloadBlob(blob, `${sanitizeCardNameForFilename(cardName)}.json`);
  }

  return (
    <button
      onClick={handleExport}
      className="flex-1 bg-navy-700 hover:bg-navy-600 text-white text-sm font-semibold py-2 px-3 transition-colors border-gold"
    >
      <svg className="inline-block w-4 h-4 mr-1 -mt-0.5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v7.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 11.586V4a1 1 0 011-1z"/><path d="M4 15a1 1 0 011 1h10a1 1 0 110 2H5a1 1 0 01-1-1v0a1 1 0 011-1z"/></svg>
      Export JSON
    </button>
  );
}
