import { exportCardPng, useExportDpi, useExportFormat, useExportHoloFoil, usePrintReady, useWhiteInkMask, useWhiteInkMaskInvert } from '@/lib/useCardExport';
import { useCardStore } from '@/lib/store';
import { isHoloActive } from '@/lib/holo/holoSettings';
import { EXPORT_DPIS, parseExportDpi, type ExportFormat } from '@/lib/printFile';
import { CollapsibleSection } from './CollapsibleSection';
import { CHECK_LABEL, FIELD_LABEL, SELECT } from './editorStyles';

interface ExportButtonProps {
  cardRef: React.RefObject<HTMLDivElement | null>;
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-gold-400" />
      <span className={CHECK_LABEL}>{label}</span>
    </label>
  );
}

export function ExportButton({ cardRef }: ExportButtonProps) {
  const [printReady, setPrintReady] = usePrintReady();
  const [format, setFormat] = useExportFormat();
  const [dpi, setDpi] = useExportDpi();
  const [mask, setMask] = useWhiteInkMask();
  const [invert, setInvert] = useWhiteInkMaskInvert();
  const [foil, setFoil] = useExportHoloFoil();
  const hasHolo = useCardStore((s) => isHoloActive(s.holo));

  const status = [format.toUpperCase(), `${dpi} dpi`, printReady && 'Bleed', hasHolo && !foil && 'No foil', mask && 'Mask'].filter(Boolean).join(' · ');

  return (
    <div className="space-y-3">
      <CollapsibleSection title="Export options" status={status}>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className={FIELD_LABEL}>Format</span>
            <select value={format} onChange={(e) => setFormat(e.target.value as ExportFormat)} className={SELECT}>
              <option value="png">PNG</option>
              <option value="svg">SVG</option>
            </select>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className={FIELD_LABEL}>DPI</span>
            <select value={dpi} onChange={(e) => setDpi(parseExportDpi(e.target.value))} className={SELECT}>
              {EXPORT_DPIS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <Check label="Print bleed" checked={printReady} onChange={setPrintReady} />
          {hasHolo && <Check label="Include holo foil" checked={foil} onChange={setFoil} />}
          <Check label="White ink mask" checked={mask} onChange={setMask} />
          {mask && (
            <div className="pl-5">
              <Check label="Invert" checked={invert} onChange={setInvert} />
            </div>
          )}
        </div>
      </CollapsibleSection>
      <button
        onClick={() => exportCardPng(cardRef.current, { printReady, format, dpi, whiteInkMask: mask ? { invert } : null, includeFoil: foil })}
        className="btn-gold w-full py-3 px-4 text-[13px] tracking-[.06em]"
      >
        <svg className="inline-block w-4 h-4 mr-1.5 -mt-0.5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v7.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 11.586V4a1 1 0 011-1z"/><path d="M4 15a1 1 0 011 1h10a1 1 0 110 2H5a1 1 0 01-1-1v0a1 1 0 011-1z"/></svg>
        Export Image
      </button>
    </div>
  );
}
