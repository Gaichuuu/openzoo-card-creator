import React from 'react';
import { INLINE_CLASSES, getVariables } from '@/data/inlineClasses';
import { resolveImagePath } from '@/lib/imagePathResolver';
import { useCardStore } from '@/lib/store';

/**
 * Parses Dextrous text content with:
 * - Inline class syntax: {ClassName:content}
 * - Variable expansion: {PSB}, {Star}, {LP}
 * - Inline images: {OpenZoo Aura/Dark.png, 0.9, 0.1}
 * - Markdown-style bold: **text** or ****text****
 * - Markdown-style italic: *text*
 * - Line breaks: /
 */

function expandVariables(text: string, variables: Record<string, string>): string {
  let result = text;
  for (const [varName, varValue] of Object.entries(variables)) {
    result = result.replaceAll(`{${varName}}`, varValue);
  }
  return result;
}

/**
 * Check if a {braced} expression is an inline image reference.
 * Format: {path/to/image.png, scale, offset} or {path/to/image.png, x, y, scale}
 */
function isInlineImage(content: string): boolean {
  return content.includes('.png') || content.includes('.jpg') || content.includes('.webp');
}

function renderInlineImage(content: string, key: string): React.ReactNode {
  // Parse: "path.png, scale, offset"
  // scale = icon height relative to font (e.g. 0.9 = 0.9em)
  // offset = vertical shift down (e.g. 0.1 = -0.1em verticalAlign)
  const parts = content.split(',').map(s => s.trim());
  const imagePath = parts[0];
  const resolved = resolveImagePath(imagePath);
  if (!resolved) return null;

  const scale = parts[1] ? parseFloat(parts[1]) : 1;
  const offset = parts[2] ? parseFloat(parts[2]) : 0;

  return (
    <img
      key={key}
      src={resolved}
      alt=""
      style={{
        display: 'inline-block',
        height: `${scale}em`,
        width: 'auto',
        verticalAlign: `${-offset}em`,
        margin: '0 0.5px',
      }}
    />
  );
}

type Segment =
  | { type: 'text'; content: string }
  | { type: 'class'; className: string; content: string }
  | { type: 'image'; content: string };

function parseSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  let i = 0;

  while (i < text.length) {
    const braceStart = text.indexOf('{', i);
    if (braceStart === -1) {
      segments.push({ type: 'text', content: text.slice(i) });
      break;
    }

    if (braceStart > i) {
      segments.push({ type: 'text', content: text.slice(i, braceStart) });
    }

    // Find matching closing brace
    let depth = 1;
    let j = braceStart + 1;
    while (j < text.length && depth > 0) {
      if (text[j] === '{') depth++;
      if (text[j] === '}') depth--;
      j++;
    }

    if (depth !== 0) {
      segments.push({ type: 'text', content: '{' });
      i = braceStart + 1;
      continue;
    }

    const braceContent = text.slice(braceStart + 1, j - 1);

    // Check for class syntax FIRST: ClassName:content
    // Must come before image check because class content may contain
    // expanded image paths (e.g. {I:If {OpenZoo Terra/X.png} ...})
    const colonPos = braceContent.indexOf(':');
    if (colonPos !== -1) {
      const className = braceContent.slice(0, colonPos);
      if (INLINE_CLASSES[className]) {
        const innerContent = braceContent.slice(colonPos + 1);
        segments.push({ type: 'class', className, content: innerContent });
        i = j;
        continue;
      }
    }

    // Check if it's an inline image
    if (isInlineImage(braceContent)) {
      segments.push({ type: 'image', content: braceContent });
      i = j;
      continue;
    }

    // Unknown brace expression, treat as text
    segments.push({ type: 'text', content: text.slice(braceStart, j) });
    i = j;
  }

  return segments;
}

/**
 * Render a text segment, splitting by newlines and " / " line-break markers.
 * This runs AFTER brace parsing so {I:multi\nline} braces are already matched.
 */
function renderTextWithBreaks(text: string, keyPrefix: string): React.ReactNode {
  const lines = text.split(/\n|(?:^|\s)\/(?:\s|$)/);
  if (lines.length === 1) return renderMarkdown(text, keyPrefix);

  return (
    <>
      {lines.map((line, i) => {
        const trimmed = line.trimStart();
        if (!trimmed && i > 0) return <br key={`${keyPrefix}-br-${i}`} />;
        return (
          <React.Fragment key={`${keyPrefix}-l-${i}`}>
            {i > 0 && <br />}
            {renderMarkdown(trimmed, `${keyPrefix}-l${i}`)}
          </React.Fragment>
        );
      })}
    </>
  );
}

function renderSegments(segments: Segment[], keyPrefix: string = ''): React.ReactNode[] {
  return segments.map((seg, idx) => {
    const key = `${keyPrefix}${idx}`;
    if (seg.type === 'text') {
      // Skip whitespace-only text between two inline images — spacing is handled by CSS margin
      if (seg.content.trim() === '' && !seg.content.includes('\n')) {
        const prev = segments[idx - 1];
        const next = segments[idx + 1];
        if (prev?.type === 'image' && next?.type === 'image') return null;
      }
      return <React.Fragment key={key}>{renderTextWithBreaks(seg.content, key)}</React.Fragment>;
    }
    if (seg.type === 'image') {
      return renderInlineImage(seg.content, key);
    }
    // Class segment - parse inner content recursively
    const style = INLINE_CLASSES[seg.className] || {};
    const innerSegments = parseSegments(seg.content);
    return (
      <span key={key} style={style}>
        {renderSegments(innerSegments, `${key}-`)}
      </span>
    );
  });
}

/**
 * Render markdown-style bold (**text**) and italic (*text*) within plain text.
 */
function renderMarkdown(text: string, keyPrefix: string): React.ReactNode {
  // Match **bold** and *italic* patterns
  const parts: React.ReactNode[] = [];
  // Process bold first (****text**** for bold+italic, **text** for bold, *text* for italic)
  const regex = /(\*{4})(.*?)\1|(\*{2})(.*?)\3|(\*)(.*?)\5/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1] === '****') {
      // Bold + italic
      parts.push(
        <span key={`${keyPrefix}-bi-${match.index}`} style={{ fontWeight: 'bold', fontStyle: 'italic' }}>
          {match[2]}
        </span>
      );
    } else if (match[3] === '**') {
      // Bold
      parts.push(
        <span key={`${keyPrefix}-b-${match.index}`} style={{ fontWeight: 'bold' }}>
          {match[4]}
        </span>
      );
    } else if (match[5] === '*') {
      // Italic
      parts.push(
        <span key={`${keyPrefix}-i-${match.index}`} style={{ fontStyle: 'italic' }}>
          {match[6]}
        </span>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex === 0) return text;
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return <>{parts}</>;
}

/**
 * Strips HTML tags and normalizes whitespace.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p>/gi, '\n')
    .replace(/<\/?p>/gi, '')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .trim();
}

interface ParsedTextProps {
  html: string;
}

export function ParsedText({ html }: ParsedTextProps) {
  if (!html) return null;

  const locale = useCardStore((s) => s.locale);
  const expanded = expandVariables(html, getVariables(locale));
  const plain = stripHtml(expanded);

  // Parse brace expressions on the full text first, so that
  // {I:multiline\ntext} has its braces matched before any line splitting.
  // Line breaks are handled inside renderTextWithBreaks for text segments.
  const segments = parseSegments(plain);

  return (
    <span>
      {renderSegments(segments, '')}
    </span>
  );
}
