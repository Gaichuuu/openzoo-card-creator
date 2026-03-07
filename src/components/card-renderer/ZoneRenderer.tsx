import { type CSSProperties, useRef, useLayoutEffect, useState } from 'react';
import type { Zone } from '@/types/layout';
import type { CardData } from '@/types/card';
import { resolveImagePath } from '@/lib/imagePathResolver';
import { FONT_BODY, FONT_CAMBRIA } from '@/data/constants';
import { useCardStore } from '@/lib/store';
import { ParsedText } from './TextParser';

function AutoShrinkText({ html, origin = 'center center', marginRight = 0 }: { html: string; origin?: string; marginRight?: number }) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const container = wrapper?.parentElement;
    if (!wrapper || !container) return;

    const measure = () => {
      // Do NOT clear wrapper.style.transform — if scale is unchanged,
      // React won't re-apply the inline style (no-op setState).
      wrapper.style.width = 'max-content';
      wrapper.style.position = 'absolute';

      const cs = getComputedStyle(container);
      const available = container.clientWidth
        - parseFloat(cs.paddingLeft)
        - parseFloat(cs.paddingRight)
        - marginRight;
      // offsetWidth gives CSS pixels; getBoundingClientRect returns scaled
      // values when the card is inside a CSS scale() transform.
      const natural = wrapper.offsetWidth;

      wrapper.style.width = '';
      wrapper.style.position = '';

      setScale(natural > available ? available / natural : 1);
    };

    measure();
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      measure();
      raf2 = requestAnimationFrame(measure);
    });
    const timer = setTimeout(measure, 150);

    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); clearTimeout(timer); };
  }, [html, marginRight]);

  return (
    <span
      ref={wrapperRef}
      style={{
        display: 'inline-block',
        whiteSpace: 'nowrap',
        transform: `scaleX(${scale})`,
        transformOrigin: origin,
      }}
    >
      <ParsedText html={html} />
    </span>
  );
}

interface ZoneRendererProps {
  zone: Zone;
  cardData: CardData;
}

function parseStyleString(str: string): CSSProperties {
  if (!str) return {};
  const result: Record<string, string> = {};
  const inner = str.replace(/^\{/, '').replace(/\}$/, '').trim();
  if (!inner) return {};

  const parts = inner.split(';').filter(Boolean);
  for (const part of parts) {
    const colonIdx = part.indexOf(':');
    if (colonIdx === -1) continue;
    const key = part.slice(0, colonIdx).trim();
    const value = part.slice(colonIdx + 1).trim();
    const camelKey = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

function buildZoneStyle(zone: Zone, styleOverride: CSSProperties): CSSProperties {
  const raw = { ...zone.style } as Record<string, any>;

  Object.assign(raw, styleOverride);

  for (const key of Object.keys(raw)) {
    if (key.includes('-')) {
      const camelKey = key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
      raw[camelKey] = raw[key];
      delete raw[key];
    }
  }

  if (raw.overflow === 'show') raw.overflow = 'visible';

  delete raw.fontName;

  if (raw.background) {
    const bg = raw.background as string;
    if (bg === 'none') {
      raw.backgroundColor = 'transparent';
      raw.backgroundImage = 'none';
    } else if (bg.includes('gradient')) {
      const lastParen = bg.lastIndexOf(')');
      raw.backgroundImage = lastParen !== -1 ? bg.slice(0, lastParen + 1) : bg;
    } else if (bg.includes('url(')) {
      // Reject url() in style overrides — images should go through resolveImagePath
    } else if (!raw.backgroundColor) {
      raw.backgroundColor = bg;
    }
  }
  delete raw.background;

  if (raw.fontFamily === "var(--cambria)") {
    raw.fontFamily = FONT_CAMBRIA;
  }
  if (raw.fontFamily === "'Lucida primary'") {
    raw.fontFamily = FONT_BODY;
  }

  return raw as CSSProperties;
}

function isZoneVisible(zone: Zone, cardData: CardData): boolean {
  if (!zone.toggleIfNoContent) return true;

  const imageKey = `i${zone.id}`;
  const textKey = `t${zone.id}`;

  if (zone.imageDataKey && cardData[imageKey]?.trim()) return true;
  if (zone.textDataKey && cardData[textKey]?.trim()) return true;

  for (const child of zone.childZones) {
    if (isZoneVisible(child, cardData)) return true;
  }

  return false;
}

const FLEX_LAYOUT_KEYS = new Set([
  'display', 'flexDirection', 'justifyContent', 'alignItems', 'alignContent',
  'gap', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
]);

export function ZoneRenderer({ zone, cardData }: ZoneRendererProps) {
  const zoneRef = useRef<HTMLDivElement>(null);
  const shouldAutoFit = zone.type === 'container' && zone.imageDataKey === 'MainTextBox';
  const isCardArtZone = zone.imageDataKey === 'CardArt' || zone.imageDataKey === 'Art';
  const mainTextBoxNudge = useCardStore((s) => shouldAutoFit ? s.mainTextBoxNudge : 0);
  const mainTextBoxExtraShrink = useCardStore((s) => shouldAutoFit ? s.mainTextBoxExtraShrink : 0);
  const cardArtPositionX = useCardStore((s) => isCardArtZone ? s.cardArtPositionX : 0);
  const cardArtPositionY = useCardStore((s) => isCardArtZone ? s.cardArtPositionY : 0);
  const shouldAutoFitTNL = zone.type === 'container' && zone.imageDataKey === 'TNL';
  const shouldAutoFitMetadata = zone.type === 'container' && zone.imageDataKey === 'CryptidInfoBar';
  const shouldAutoFitFlavor = zone.textDataKey === 'FlavorText';
  const needsTwoDiv = shouldAutoFit || shouldAutoFitTNL || shouldAutoFitMetadata || shouldAutoFitFlavor;

  useLayoutEffect(() => {
    if (!shouldAutoFit && !shouldAutoFitTNL && !shouldAutoFitMetadata && !shouldAutoFitFlavor) return;
    const el = zoneRef.current; 
    if (!el) return;

    const heightStr = zone.style.height as string;
    const baseHeight = parseFloat(heightStr);
    if (!baseHeight || isNaN(baseHeight) || !heightStr?.endsWith('px')) return;

    if (shouldAutoFitTNL) {
      el.style.zoom = '1';
      el.style.height = 'auto';
      el.style.width = '100%';

      const contentHeight = el.offsetHeight;
      const currentWidth = el.offsetWidth;

      if (contentHeight > baseHeight) {
        const ratio = baseHeight / contentHeight;
        el.style.zoom = String(ratio);
        el.style.height = `${contentHeight}px`;
        el.style.width = `${currentWidth / ratio}px`;
      } else {
        el.style.height = `${baseHeight}px`;
      }
      return;
    }

    if (shouldAutoFitFlavor) {
      const baseWidth = parseFloat(zone.style.width as string) || el.offsetWidth;

      el.style.zoom = '1';
      el.style.height = 'auto';
      el.style.width = `${baseWidth}px`;
      const nativeHeight = el.offsetHeight;

      if (nativeHeight <= baseHeight) {
        el.style.height = `${baseHeight}px`;
        el.style.width = '100%';
        return;
      }

      let lo = 0.1;
      let hi = 1.0;
      let bestRatio = lo;

      for (let i = 0; i < 12; i++) {
        const mid = (lo + hi) / 2;
        el.style.zoom = '1';
        el.style.height = 'auto';
        el.style.width = `${baseWidth / mid}px`;
        const contentH = el.offsetHeight;
        const visualH = contentH * mid;

        if (visualH <= baseHeight) {
          bestRatio = mid;
          lo = mid; 
        } else {
          hi = mid; 
        }
      }

      el.style.zoom = String(bestRatio);
      el.style.width = `${baseWidth / bestRatio}px`;
      el.style.height = 'auto';
      el.style.marginTop = '0px';
      const finalHeight = el.offsetHeight;
      el.style.height = `${finalHeight}px`;

      const visualHeight = finalHeight * bestRatio;
      const gap = baseHeight - visualHeight;
      if (gap > 1) {
        el.style.marginTop = `${gap / (2 * bestRatio)}px`;
      }
      return;
    }

    if (shouldAutoFitMetadata) {
      const baseWidth = parseFloat(zone.style.width as string) || 0;
      const baseHeight = parseFloat(zone.style.height as string) || 0;

      el.style.zoom = '1';
      el.style.width = 'max-content';
      el.style.height = `${baseHeight}px`;

      const naturalWidth = el.offsetWidth;

      if (naturalWidth > baseWidth) {
        const ratio = baseWidth / naturalWidth;
        el.style.zoom = String(ratio);
        el.style.width = `${naturalWidth}px`;
        el.style.height = `${baseHeight / ratio}px`;
      } else {
        el.style.width = `${baseWidth}px`;
      }
      return;
    }

    const baseWidth = parseFloat(zone.style.width as string) || 0;

    const runAutoFit = () => {
      el.style.zoom = '1';
      el.style.height = 'auto';
      el.style.width = `${baseWidth}px`;

      const childZoneById = new Map(zone.childZones.map((z) => [String(z.id), z]));
      const children = Array.from(el.children) as HTMLElement[];
      for (const child of children) {
        const cz = childZoneById.get(child.getAttribute('data-zone-id') || '');
        child.style.width = cz ? (cz.style.width as string || '') : '';
        child.style.height = cz ? (cz.style.height as string || '') : '';
        child.style.minHeight = '';
        child.style.flexShrink = '';
      }

      const containerOverride = parseStyleString(cardData[`s${zone.id}`] || '');
      el.style.paddingTop = (containerOverride.paddingTop as string) || '1px';
      for (const child of children) {
        const childId = child.getAttribute('data-zone-id');
        if (childId) {
          const childOverride = parseStyleString(cardData[`s${childId}`] || '');
          child.style.paddingTop = childOverride.paddingTop
            ? (childOverride.paddingTop as string)
            : '';
        }
      }

      let boostPaddingEl: HTMLElement | null = null;
      let boostPaddingValue = 0;
      const containerPT = parseFloat(getComputedStyle(el).paddingTop) || 0;
      if (containerPT > 10) {
        boostPaddingEl = el;
        boostPaddingValue = containerPT;
      } else {
        for (const child of children) {
          const childPT = parseFloat(getComputedStyle(child).paddingTop) || 0;
          if (childPT > 10) {
            boostPaddingEl = child;
            boostPaddingValue = childPT;
            break;
          }
        }
      }

      if (boostPaddingEl) {
        boostPaddingEl.style.paddingTop = '0px';
      }

      const contentHeight = el.offsetHeight;
      const availableHeight = baseHeight - boostPaddingValue;
      const autoRatio = contentHeight > availableHeight
        ? (availableHeight - 2) / contentHeight
        : 1;
      const finalRatio = autoRatio * (1 - mainTextBoxExtraShrink * 0.02);

      useCardStore.getState()._setAutoFitRatio(autoRatio);

      if (finalRatio < 1) {
        const ratio = finalRatio;
        const childWidths = children.map((c) => c.offsetWidth);

        el.style.zoom = String(ratio);
        el.style.width = `${baseWidth / ratio}px`;

        if (boostPaddingEl) {
          const compensatedPadding = boostPaddingValue / ratio;
          el.style.height = `${contentHeight + compensatedPadding}px`;
          boostPaddingEl.style.paddingTop = `${compensatedPadding}px`;
        } else {
          el.style.height = `${contentHeight}px`;
        }

        children.forEach((child, i) => {
          if (childWidths[i] > 0) {
            child.style.width = `${childWidths[i] / ratio}px`;
          }
          const cz = childZoneById.get(child.getAttribute('data-zone-id') || '');
          if (cz) {
            const h = parseFloat(cz.style.height as string);
            if (!isNaN(h) && h > 0 && h <= 2) {
              const compensated = `${(h + 0.05) / ratio}px`;
              child.style.height = compensated;
              child.style.minHeight = compensated;
              child.style.flexShrink = '0';
            }
          }
        });

        el.style.transform = mainTextBoxNudge !== 0
          ? `translateY(${mainTextBoxNudge}px)`
          : '';
      } else {
        el.style.zoom = '1';
        el.style.height = `${baseHeight}px`;
        if (boostPaddingEl) {
          boostPaddingEl.style.paddingTop = `${boostPaddingValue}px`;
        }
        el.style.transform = mainTextBoxNudge !== 0
          ? `translateY(${mainTextBoxNudge}px)`
          : '';
      }
    };

    runAutoFit();

    const images = Array.from(el.querySelectorAll('img')).filter(img => !img.complete);
    if (images.length > 0) {
      const onLoad = () => runAutoFit();
      for (const img of images) {
        img.addEventListener('load', onLoad, { once: true });
      }
      return () => {
        for (const img of images) {
          img.removeEventListener('load', onLoad);
        }
      };
    }
  });

  if (!isZoneVisible(zone, cardData)) {
    return null;
  }

  const styleKey = `s${zone.id}`;
  const styleOverride = parseStyleString(cardData[styleKey] || '');
  const style = buildZoneStyle(zone, styleOverride);

  let backgroundImage: string | undefined;
  if (zone.type === 'image') {
    const imageKey = `i${zone.id}`;
    const rawImagePath = cardData[imageKey] || zone.image;
    if (rawImagePath && rawImagePath !== 'default_image') {
      const resolvedPath = resolveImagePath(rawImagePath);
      if (resolvedPath) {
        backgroundImage = `url('${resolvedPath}')`;
      }
    }
  }

  let textContent: string | null = null;
  if (zone.type === 'text' || zone.textDataKey) {
    const textKey = `t${zone.id}`;
    textContent = cardData[textKey] || null;
  }

  const finalStyle: CSSProperties = {
    ...style,
    ...(backgroundImage ? {
      backgroundImage,
      backgroundSize: (zone.imageDataKey === 'SetSymbol' || zone.imageDataKey?.startsWith('Trait') || zone.imageDataKey?.startsWith('SAura') || zone.imageDataKey?.startsWith('Terra'))
        ? 'contain' : (style.backgroundSize || 'cover'),
      backgroundPosition: isCardArtZone
        ? `${50 + cardArtPositionX}% ${50 + cardArtPositionY}%`
        : (style.backgroundPosition || 'center'),
      backgroundRepeat: 'no-repeat',
    } : {}),
    boxSizing: 'border-box',
  };

  const shouldShrink = textContent && zone.type === 'text' &&
    (zone.textDataKey === 'Boost 1' || zone.textDataKey === 'Boost 2' || zone.textDataKey === 'TypesTribes' || zone.textDataKey === 'CardName');

  if (needsTwoDiv) {
    const outerStyle: CSSProperties = {};
    const innerStyle: CSSProperties = {
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
    };

    for (const [key, value] of Object.entries(finalStyle)) {
      if (FLEX_LAYOUT_KEYS.has(key)) {
        (innerStyle as any)[key] = value;
      } else {
        (outerStyle as any)[key] = value;
      }
    }

    outerStyle.overflow = shouldAutoFitFlavor ? 'visible' : 'hidden';

    return (
      <div style={outerStyle} data-zone-id={zone.id} data-zone-key={zone.imageDataKey || zone.textDataKey}>
        <div ref={zoneRef} style={innerStyle}>
          {textContent && shouldAutoFitFlavor && <ParsedText html={textContent} />}
          {zone.childZones.map((child, idx) => (
            <ZoneRenderer key={`${child.id}-${idx}`} zone={child} cardData={cardData} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={finalStyle} data-zone-id={zone.id} data-zone-key={zone.imageDataKey || zone.textDataKey}>
      {textContent && (zone.type === 'text' || zone.textDataKey) && (
        shouldShrink
          ? <AutoShrinkText html={textContent} origin={zone.textDataKey === 'TypesTribes' || zone.textDataKey === 'CardName' ? 'left center' : 'center center'} marginRight={zone.textDataKey === 'CardName' ? 2 : 0} />
          : <ParsedText html={textContent} />
      )}

      {zone.childZones.map((child, idx) => (
        <ZoneRenderer key={`${child.id}-${idx}`} zone={child} cardData={cardData} />
      ))}
    </div>
  );
}
