import { useRef } from 'react';
import { useCardStore } from '@/lib/store';
import type { CardSnapshot } from '@/types/card';

interface JsonImportButtonProps {
  onImport?: () => void;
}

export function JsonImportButton({ onImport }: JsonImportButtonProps) {
  const loadSnapshot = useCardStore((s) => s.loadSnapshot);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as CardSnapshot;
        if (!parsed.layoutType || !parsed.cardData) {
          alert('Invalid card file: missing layoutType or cardData');
          return;
        }
        loadSnapshot(parsed);
        onImport?.();
      } catch {
        alert('Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
  }

  return (
    <>
      <button
        onClick={() => inputRef.current?.click()}
        className="flex-1 bg-navy-700 hover:bg-navy-600 text-white text-sm font-semibold py-2 px-3 transition-colors border-gold"
      >
        Import JSON
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".json"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
        className="hidden"
      />
    </>
  );
}
