import { useRef } from 'react';
import { useCardStore } from '@/lib/store';
import type { CardSnapshot, CardType } from '@/types/card';
import type { LayoutType } from '@/types/layout';

const VALID_LAYOUT_TYPES: ReadonlySet<string> = new Set<LayoutType>([
  'BasicNoAttack', 'BasicOnlyAttack', 'BasicAttackMain', 'Aura', 'Terra',
]);
const VALID_CARD_TYPES: ReadonlySet<string> = new Set<CardType>([
  'Artifact', 'Aura', 'Beastie', 'Potion', 'Special Aura', 'Special Terra', 'Spell', 'Terra', 'Token',
]);
const MAX_STRING_LEN = 1000;
const MAX_CARD_DATA_KEYS = 500;

function validateSnapshot(data: unknown): data is CardSnapshot {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return false;
  const obj = data as Record<string, unknown>;

  if (typeof obj.layoutType !== 'string' || !VALID_LAYOUT_TYPES.has(obj.layoutType)) return false;
  if (typeof obj.cardType !== 'string' || !VALID_CARD_TYPES.has(obj.cardType)) return false;
  if (typeof obj.cardData !== 'object' || obj.cardData === null || Array.isArray(obj.cardData)) return false;

  const cardData = obj.cardData as Record<string, unknown>;
  const keys = Object.keys(cardData);
  if (keys.length > MAX_CARD_DATA_KEYS) return false;
  for (const key of keys) {
    if (typeof cardData[key] !== 'string') return false;
    if ((cardData[key] as string).length > MAX_STRING_LEN) return false;
  }

  if (typeof obj.cardName !== 'string' || obj.cardName.length > 100) return false;

  return true;
}

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
        const parsed = JSON.parse(reader.result as string);
        if (!validateSnapshot(parsed)) {
          alert('Invalid card file: missing or invalid fields');
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
