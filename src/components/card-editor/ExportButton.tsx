import { exportCardPng, usePrintReady } from '@/lib/useCardExport';

interface ExportButtonProps {
  cardRef: React.RefObject<HTMLDivElement | null>;
}

export function ExportButton({ cardRef }: ExportButtonProps) {
  const [printReady, setPrintReady] = usePrintReady();

  return (
    <div className="space-y-2">
      <label className="flex items-center justify-end gap-2 cursor-pointer select-none">
        <span className="text-sm text-gray-300">Print Ready</span>
        <button
          type="button"
          role="checkbox"
          aria-checked={printReady}
          onClick={() => setPrintReady(!printReady)}
          className={`w-3.5 h-3.5 flex items-center justify-center border text-[10px] leading-none transition-colors ${
            printReady
              ? 'bg-gold-500 border-gold-500 text-navy-950'
              : 'bg-navy-700 border-navy-600'
          }`}
        >
          {printReady ? '✓' : ''}
        </button>
      </label>
      <button
        onClick={() => exportCardPng(cardRef.current, { printReady })}
        className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-4 transition-colors border-gold"
      >
        <svg className="inline-block w-4 h-4 mr-1.5 -mt-0.5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v7.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 11.586V4a1 1 0 011-1z"/><path d="M4 15a1 1 0 011 1h10a1 1 0 110 2H5a1 1 0 01-1-1v0a1 1 0 011-1z"/></svg>
        Export PNG
      </button>
    </div>
  );
}
