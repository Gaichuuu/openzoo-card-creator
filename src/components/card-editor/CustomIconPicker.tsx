import { useEffect, useState } from 'react';
import { ATTACK_ELEMENTS } from '@/data/constants';
import type { Element } from '@/types/card';
import type { CustomIcon, CustomIconType } from '@/types/customIcons';
import {
  ICON_MAX_DIM, BACKGROUND_MAX_DIM,
  loadLocalIcons, saveLocalIcon, deleteLocalIcon,
  fetchCommunityIcons, shareIcon,
} from '@/lib/customIconLibrary';
import { processImageFile } from '@/lib/imageUtils';
import { fetchAsDataUrl } from '@/lib/exportUtils';
import { generateId } from '@/lib/publishUtils';
import { DEFAULT_CUSTOM_BG, DEFAULT_CUSTOM_BORDER } from '@/lib/customIconUtils';

interface CustomIconPickerProps {
  type: CustomIconType;
  title: string;
  open: boolean;
  onClose: () => void;
  onSelect: (icon: CustomIcon) => void;
}

export function CustomIconPicker({ type, title, open, onClose, onSelect }: CustomIconPickerProps) {
  const [localIcons, setLocalIcons] = useState<CustomIcon[]>([]);
  const [community, setCommunity] = useState<CustomIcon[] | 'error' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [preview, setPreview] = useState('');
  const [name, setName] = useState('');
  const [share, setShare] = useState(false);
  const [creatorName, setCreatorName] = useState('');
  const [cardBackground, setCardBackground] = useState(DEFAULT_CUSTOM_BG);
  const [artBorder, setArtBorder] = useState(DEFAULT_CUSTOM_BORDER);
  const [strongAgainst, setStrongAgainst] = useState<Element[]>([]);

  const isAura = type === 'aura';
  const maxDim = type === 'background' ? BACKGROUND_MAX_DIM : ICON_MAX_DIM;

  useEffect(() => {
    if (!open) return;
    setLocalIcons(loadLocalIcons(type));
    setCommunity(null);
    setError('');
    fetchCommunityIcons(type)
      .then(setCommunity)
      .catch(() => setCommunity('error'));
  }, [open, type]);

  if (!open) return null;

  async function handleFileChange(f: File) {
    setError('');
    try {
      const { url } = type === 'background'
        ? await processImageFile(f, maxDim, 'image/webp', 0.9)
        : await processImageFile(f, maxDim);
      setPreview(url);
    } catch {
      setError('Could not read that image.');
      setPreview('');
    }
  }

  function toggleStrong(el: Element) {
    setStrongAgainst((prev) =>
      prev.includes(el) ? prev.filter((e) => e !== el)
        : prev.length >= 4 ? prev
        : [...prev, el]);
  }

  async function handleUseUpload() {
    if (!preview) { setError('Choose an image first.'); return; }
    setBusy(true);
    setError('');
    const icon: CustomIcon = {
      id: generateId(),
      type,
      name: name.trim(),
      image: preview,
      ...(isAura ? { aura: { cardBackground, artBorder, strongAgainst } } : {}),
      ...(creatorName.trim() ? { creatorName: creatorName.trim() } : {}),
      createdAt: Date.now(),
    };
    const saved = saveLocalIcon(icon);
    let shareFailed = false;
    if (share) {
      try {
        await shareIcon(icon);
      } catch {
        shareFailed = true;
      }
    }
    setBusy(false);
    onSelect(icon);
    if (!saved || shareFailed) {
      const problem = saved
        ? 'Sharing to the community failed.'
        : 'Could not save to your library (storage full).';
      setError(`${problem} The icon was still applied to your card.`);
      return;
    }
    onClose();
  }

  async function handlePick(icon: CustomIcon) {
    setError('');
    if (icon.image.startsWith('data:')) {
      onSelect(icon);
      onClose();
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await fetchAsDataUrl(icon.image);
      onSelect({ ...icon, image: dataUrl });
      onClose();
    } catch {
      setError('Could not load that icon, try another.');
    } finally {
      setBusy(false);
    }
  }

  function handleDelete(id: string) {
    deleteLocalIcon(id);
    setLocalIcons(loadLocalIcons(type));
  }

  const tileGrid = (icons: CustomIcon[], deletable: boolean) => (
    <div className="grid grid-cols-5 gap-2">
      {icons.map((icon) => (
        <div key={icon.id} className="relative group">
          <button
            onClick={() => handlePick(icon)}
            disabled={busy}
            title={icon.name || 'Unnamed'}
            className="w-full aspect-square bg-navy-800 border border-navy-600 rounded p-1 hover:border-gold-400 focus:outline-none focus:border-gold-400"
          >
            <img src={icon.image} alt={icon.name || 'Custom icon'} className="w-full h-full object-contain" />
          </button>
          {deletable && (
            <button
              onClick={() => handleDelete(icon.id)}
              aria-label="Delete from library"
              className="absolute -top-1 -right-1 hidden group-hover:block bg-navy-990 text-red-400 rounded-full w-4 h-4 text-[10px] leading-4"
            >
              ×
            </button>
          )}
          {icon.name && (
            <div className="text-[9px] text-gold-500 truncate text-center">{icon.name}</div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="bg-navy-900 border border-navy-600 rounded-lg w-full max-w-md max-h-[85vh] overflow-y-auto p-4 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gold-400 uppercase tracking-wider">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-gold-500 hover:text-white">✕</button>
        </div>

        {/* Upload */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gold-400 uppercase tracking-wider">Upload new</label>
          <div className="flex gap-2 items-start">
            <label className="w-16 h-16 shrink-0 border-gold-dashed rounded flex items-center justify-center cursor-pointer overflow-hidden">
              {preview
                ? <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                : <span className="text-[10px] text-gold-500 text-center px-1">Choose image</span>}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f && f.type !== 'image/svg+xml') handleFileChange(f);
                }}
              />
            </label>
            <div className="flex-1 space-y-1">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name (optional)"
                maxLength={40}
                className="w-full bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-sm focus:outline-none focus:border-gold-400"
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} className="accent-gold-400" />
                <span className="text-xs text-gray-400">Share to community</span>
              </label>
              {share && (
                <input
                  type="text"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  placeholder="Creator name (optional)"
                  maxLength={40}
                  className="w-full bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-sm focus:outline-none focus:border-gold-400"
                />
              )}
            </div>
          </div>

          {isAura && (
            <div className="space-y-2">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs text-gray-400">
                  Card color
                  <input type="color" value={cardBackground} onChange={(e) => setCardBackground(e.target.value)} className="w-8 h-6 bg-transparent" />
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-400">
                  Art border
                  <input type="color" value={artBorder} onChange={(e) => setArtBorder(e.target.value)} className="w-8 h-6 bg-transparent" />
                </label>
              </div>
              <div>
                <span className="text-xs text-gray-400">Strong against (up to 4)</span>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                  {ATTACK_ELEMENTS.map((el) => (
                    <label key={el} className="flex items-center gap-1 text-xs text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={strongAgainst.includes(el)}
                        disabled={!strongAgainst.includes(el) && strongAgainst.length >= 4}
                        onChange={() => toggleStrong(el)}
                        className="accent-gold-400"
                      />
                      {el}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleUseUpload}
            disabled={busy || !preview}
            className="w-full bg-navy-800 border border-gold text-gold-400 rounded px-2 py-1 text-sm hover:text-white disabled:opacity-50"
          >
            {busy ? 'Working…' : 'Use this icon'}
          </button>
        </div>

        {/* Icons saved in this browser's localStorage */}
        {localIcons.length > 0 && (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gold-400 uppercase tracking-wider">Saved in local cache</label>
            {tileGrid(localIcons, true)}
          </div>
        )}

        {/* Community */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gold-400 uppercase tracking-wider">Community</label>
          {community === null && <div className="text-xs text-gold-500">Loading…</div>}
          {community === 'error' && <div className="text-xs text-gray-500">Community icons unavailable.</div>}
          {Array.isArray(community) && community.length === 0 && (
            <div className="text-xs text-gray-500">No shared icons yet.</div>
          )}
          {Array.isArray(community) && community.length > 0 && tileGrid(community, false)}
        </div>

        {error && <div className="text-[11px] text-red-400">{error}</div>}
      </div>
    </div>
  );
}
