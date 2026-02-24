import { type CSSProperties, useRef, useLayoutEffect, useState } from 'react';
import type { Zone } from '@/types/layout';
import type { CardData } from '@/types/card';
import { resolveImagePath } from '@/lib/imagePathResolver';
import { ParsedText } from './TextParser';

function AutoShrinkText({ html, origin = 'center center', marginRight = 0 }: { html: string; origin?: string; marginRight?: number }) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const container = wrapper?.parentElement;
    if (!wrapper || !container) return;

    // Remove from flex flow for accurate intrinsic width measurement
    wrapper.style.transform = 'none';
    wrapper.style.width = 'max-content';
    wrapper.style.position = 'absolute';

    const cs = getComputedStyle(container);
    const available = container.clientWidth
      - parseFloat(cs.paddingLeft)
      - parseFloat(cs.paddingRight)
      - marginRight;
    // Use offsetWidth (CSS pixels) not getBoundingClientRect (screen pixels)
    // because the card is rendered inside a CSS scale() transform
    const natural = wrapper.offsetWidth;

    // Restore layout
    wrapper.style.width = '';
    wrapper.style.position = '';

    setScale(natural > available ? available / natural : 1);
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

/**
 * Parse a Dextrous style override string like "{background:rgba(3, 159, 78, 1)}"
 * into a CSSProperties object.
 */
function parseStyleString(str: string): CSSProperties {
  if (!str) return {};
  const result: Record<string, string> = {};
  // Remove outer braces
  const inner = str.replace(/^\{/, '').replace(/\}$/, '').trim();
  if (!inner) return {};

  // Split by semicolons or by property patterns
  // Handle "background:rgba(3, 159, 78, 1)" format
  const parts = inner.split(';').filter(Boolean);
  for (const part of parts) {
    const colonIdx = part.indexOf(':');
    if (colonIdx === -1) continue;
    const key = part.slice(0, colonIdx).trim();
    const value = part.slice(colonIdx + 1).trim();
    // Convert CSS key to camelCase
    const camelKey = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

/**
 * Translates Dextrous zone styles to valid React CSS properties.
 */
function buildZoneStyle(zone: Zone, styleOverride: CSSProperties): CSSProperties {
  const raw = { ...zone.style } as Record<string, any>;

  // Apply style overrides from cardData
  Object.assign(raw, styleOverride);

  // Convert hyphenated CSS keys to React camelCase. Layout data from
  // Dextrous has raw CSS names like "-webkit-text-stroke-width" which
  // React doesn't accept — it expects "WebkitTextStrokeWidth".
  for (const key of Object.keys(raw)) {
    if (key.includes('-')) {
      const camelKey = key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
      raw[camelKey] = raw[key];
      delete raw[key];
    }
  }

  // Translate non-standard values
  if (raw.overflow === 'show') raw.overflow = 'visible';

  // Remove non-CSS properties
  delete raw.fontName;

  // Replace `background` shorthand with specific longhands — the shorthand
  // resets all background-* longhands (backgroundSize, backgroundOrigin,
  // backgroundRepeat, etc.) and React warns when both shorthand and
  // longhands are present on the same element. Zone base styles from
  // Dextrous layouts include background longhands alongside the shorthand.
  if (raw.background) {
    const bg = raw.background as string;
    if (bg === 'none') {
      raw.backgroundColor = 'transparent';
      raw.backgroundImage = 'none';
    } else if (bg.includes('gradient') || bg.includes('url(')) {
      // Extract just the image function — background shorthand may include
      // repeat/position/size parts that are invalid for backgroundImage.
      const lastParen = bg.lastIndexOf(')');
      raw.backgroundImage = lastParen !== -1 ? bg.slice(0, lastParen + 1) : bg;
    } else if (!raw.backgroundColor) {
      raw.backgroundColor = bg;
    }
  }
  delete raw.background;

  // Handle Dextrous font references
  if (raw.fontFamily === "var(--cambria)") {
    raw.fontFamily = "'Cambria', 'Crimson Text', 'Times New Roman', serif";
  }
  if (raw.fontFamily === "'Lucida primary'") {
    raw.fontFamily = "'Luxi Sans', sans-serif";
  }

  return raw as CSSProperties;
}

/**
 * Checks whether a zone should be visible based on toggleIfNoContent.
 */
function isZoneVisible(zone: Zone, cardData: CardData): boolean {
  if (!zone.toggleIfNoContent) return true;

  // Check if this zone has content in cardData
  const imageKey = `i${zone.id}`;
  const textKey = `t${zone.id}`;

  if (zone.imageDataKey && cardData[imageKey]?.trim()) return true;
  if (zone.textDataKey && cardData[textKey]?.trim()) return true;

  // For containers, check if any child has content
  for (const child of zone.childZones) {
    if (isZoneVisible(child, cardData)) return true;
  }

  return false;
}

/** CSS properties that belong on the inner flex wrapper (not the outer positioned container) */
const FLEX_LAYOUT_KEYS = new Set([
  'display', 'flexDirection', 'justifyContent', 'alignItems', 'alignContent',
  'gap', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
]);

export function ZoneRenderer({ zone, cardData }: ZoneRendererProps) {
  // Auto-fit: shrink container content with CSS zoom when it overflows.
  // Must be declared before any conditional returns (hooks rules).
  const zoneRef = useRef<HTMLDivElement>(null);
  const shouldAutoFit = zone.type === 'container' && zone.imageDataKey === 'MainTextBox';
  const shouldAutoFitTNL = zone.type === 'container' && zone.imageDataKey === 'TNL';
  const shouldAutoFitMetadata = zone.type === 'container' && zone.imageDataKey === 'CryptidInfoBar';
  const shouldAutoFitFlavor = zone.textDataKey === 'FlavorText';
  const needsTwoDiv = shouldAutoFit || shouldAutoFitTNL || shouldAutoFitMetadata || shouldAutoFitFlavor;

  useLayoutEffect(() => {
    if (!shouldAutoFit && !shouldAutoFitTNL && !shouldAutoFitMetadata && !shouldAutoFitFlavor) return;
    const el = zoneRef.current; // Inner zoom wrapper
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
        // width stays at 100%
      }
      return;
    }

    // Binary search accounts for text reflow: at wider effective widths (from
    // zoom), text wraps to fewer lines, so a single-pass zoom overshoots.
    if (shouldAutoFitFlavor) {
      const baseWidth = parseFloat(zone.style.width as string) || el.offsetWidth;

      // First check if text fits at native size
      el.style.zoom = '1';
      el.style.height = 'auto';
      el.style.width = `${baseWidth}px`;
      const nativeHeight = el.offsetHeight;

      if (nativeHeight <= baseHeight) {
        el.style.height = `${baseHeight}px`;
        el.style.width = '100%';
        return;
      }

      // Binary search for maximum ratio where text visually fits
      let lo = 0.1;
      let hi = 1.0;
      let bestRatio = lo;

      for (let i = 0; i < 12; i++) {
        const mid = (lo + hi) / 2;
        // At this zoom, the effective layout width is baseWidth / mid
        el.style.zoom = '1';
        el.style.height = 'auto';
        el.style.width = `${baseWidth / mid}px`;
        const contentH = el.offsetHeight;
        const visualH = contentH * mid;

        if (visualH <= baseHeight) {
          bestRatio = mid;
          lo = mid; // Try less zoom (bigger text)
        } else {
          hi = mid; // Need more zoom (smaller text)
        }
      }

      el.style.zoom = String(bestRatio);
      el.style.width = `${baseWidth / bestRatio}px`;
      el.style.height = 'auto';
      el.style.marginTop = '0px';
      const finalHeight = el.offsetHeight;
      el.style.height = `${finalHeight}px`;

      // Vertically center within the zone (margin is also scaled by zoom)
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
      // Reset zoom and dimensions to measure natural content height.
      // The inner wrapper is at (0,0) within the outer container,
      // so zoom doesn't shift it — no top/left compensation needed.
      el.style.zoom = '1';
      el.style.height = 'auto';
      el.style.width = `${baseWidth}px`;

      // Restore children to their zone-defined dimensions.
      // Using '' would remove React's inline styles (React skips unchanged
      // virtual DOM properties), so restore from the zone layout data instead.
      const childZoneById = new Map(zone.childZones.map((z) => [String(z.id), z]));
      const children = Array.from(el.children) as HTMLElement[];
      for (const child of children) {
        const cz = childZoneById.get(child.getAttribute('data-zone-id') || '');
        child.style.width = cz ? (cz.style.width as string || '') : '';
        child.style.height = cz ? (cz.style.height as string || '') : '';
      }

      // Restore paddingTop from style overrides. React's reconciler won't
      // re-apply unchanged virtual DOM values, so after we modify paddingTop
      // in a previous effect run it persists unless we explicitly reset it.
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

      // Detect boost-clearance paddingTop (> 10px) on container or children.
      // Boost zones (Boost 1/2) visually overlay this container but are NOT
      // structurally its children, so zoom won't scale them. The paddingTop
      // set by effectComposer clears the boosts and must remain visually
      // constant after zoom — we compensate it separately.
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

      // Temporarily remove boost padding for content-only measurement
      if (boostPaddingEl) {
        boostPaddingEl.style.paddingTop = '0px';
      }

      // Measure content height (excluding boost clearance padding).
      // offsetHeight forces a synchronous reflow for true content height.
      const contentHeight = el.offsetHeight;

      // Available height: reserve unscaled space for boost clearance
      const availableHeight = baseHeight - boostPaddingValue;

      if (contentHeight > availableHeight) {
        // Slight inset so sub-pixel rounding doesn't clip the last line
        const ratio = (availableHeight - 2) / contentHeight;

        // Measure each child's width at zone-defined dimensions before zoom
        const childWidths = children.map((c) => c.offsetWidth);

        // Apply zoom to inner wrapper. Since it's at (0,0) within the
        // outer container, zoom doesn't shift its position — only width
        // needs compensation so the visual size stays correct.
        el.style.zoom = String(ratio);
        el.style.width = `${baseWidth / ratio}px`;
        el.style.overflow = 'hidden';

        // Set height to include content + compensated boost padding.
        // Visual: (content + compensated) * ratio = (avail-2) + boostPad = base-2
        if (boostPaddingEl) {
          const compensatedPadding = boostPaddingValue / ratio;
          el.style.height = `${contentHeight + compensatedPadding}px`;
          boostPaddingEl.style.paddingTop = `${compensatedPadding}px`;
        } else {
          el.style.height = `${contentHeight}px`;
        }

        // Compensate children dimensions — fixed pixel values are scaled
        // by zoom, so divide by ratio to maintain visual size.
        children.forEach((child, i) => {
          if (childWidths[i] > 0) {
            child.style.width = `${childWidths[i] / ratio}px`;
          }
          // Compensate thin fixed-height children (like dividers) that
          // would become sub-pixel and invisible after zoom
          const cz = childZoneById.get(child.getAttribute('data-zone-id') || '');
          if (cz) {
            const h = parseFloat(cz.style.height as string);
            if (!isNaN(h) && h > 0 && h <= 2) {
              child.style.height = `${h / ratio}px`;
            }
          }
        });
      } else {
        el.style.height = `${baseHeight}px`;
        el.style.overflow = '';
        // Restore boost padding (was removed for measurement)
        if (boostPaddingEl) {
          boostPaddingEl.style.paddingTop = `${boostPaddingValue}px`;
        }
      }
    };

    runAutoFit();

    // Re-run auto-fit when pending inline images finish loading.
    // On first render, inline images (e.g. status effect icons in attack
    // text) may not be cached yet — their width is unknown (height is set
    // via CSS em units but width:auto needs the aspect ratio), so the
    // initial measurement underestimates content height. When they load,
    // the content grows and can overflow/clip siblings like AttackDivider.
    // On subsequent renders the images are browser-cached and available
    // immediately, which is why "import twice" previously fixed the bug.
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

  // Check visibility
  if (!isZoneVisible(zone, cardData)) {
    return null;
  }

  // Resolve style override from cardData
  const styleKey = `s${zone.id}`;
  const styleOverride = parseStyleString(cardData[styleKey] || '');
  const style = buildZoneStyle(zone, styleOverride);

  // Resolve image for image zones
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

  // Resolve text for text zones
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
      backgroundPosition: style.backgroundPosition || 'center',
      backgroundRepeat: 'no-repeat',
    } : {}),
    boxSizing: 'border-box',
  };

  const shouldShrink = textContent && zone.type === 'text' &&
    (zone.textDataKey === 'Boost 1' || zone.textDataKey === 'Boost 2' || zone.textDataKey === 'TypesTribes' || zone.textDataKey === 'CardName');

  // For auto-fit zones, split into outer positioned container + inner zoom wrapper.
  // The outer container keeps positional/visual styles and stays at its original
  // position. The inner wrapper gets flex/padding styles and receives the zoom.
  // Since the wrapper is at (0,0), zoom can't shift its position (0 * anything = 0),
  // eliminating the positional shift that occurred when zooming the container directly.
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

    // Outer container: clip zoomed content, no flex layout
    outerStyle.overflow = 'hidden';

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
      {/* Render text content for text zones (or containers with a textDataKey) */}
      {textContent && (zone.type === 'text' || zone.textDataKey) && (
        shouldShrink
          ? <AutoShrinkText html={textContent} origin={zone.textDataKey === 'TypesTribes' || zone.textDataKey === 'CardName' ? 'left center' : 'center center'} marginRight={zone.textDataKey === 'CardName' ? 2 : 0} />
          : <ParsedText html={textContent} />
      )}

      {/* Render children */}
      {zone.childZones.map((child, idx) => (
        <ZoneRenderer key={`${child.id}-${idx}`} zone={child} cardData={cardData} />
      ))}
    </div>
  );
}
