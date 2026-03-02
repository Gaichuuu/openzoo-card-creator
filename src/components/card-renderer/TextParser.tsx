import React from 'react';
import { INLINE_CLASSES, getVariables } from '@/data/inlineClasses';
import { resolveImagePath } from '@/lib/imagePathResolver';
import { useCardStore } from '@/lib/store';
import { expandVariables, parseSegments, stripHtml } from '@/lib/textParserUtils';
import type { Segment } from '@/lib/textParserUtils';

function renderInlineImage(content: string, key: string): React.ReactNode {
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

function renderTextWithBreaks(text: string, keyPrefix: string): React.ReactNode {
  const lines = text.split(/\n|(?:^|\s)\/(?:\s|$)/);
  if (lines.length === 1) return renderMarkdown(text, keyPrefix);

  return (
    <>
      {lines.map((line, i) => {
        const trimmed = i === 0 ? line : line.trimStart();
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
    const style = INLINE_CLASSES[seg.className] || {};
    const innerSegments = parseSegments(seg.content);
    return (
      <span key={key} style={style}>
        {renderSegments(innerSegments, `${key}-`)}
      </span>
    );
  });
}

function renderMarkdown(text: string, keyPrefix: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*{4})(.*?)\1|(\*{2})(.*?)\3|(\*)(.*?)\5/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1] === '****') {
      parts.push(
        <span key={`${keyPrefix}-bi-${match.index}`} style={{ fontWeight: 'bold', fontStyle: 'italic' }}>
          {match[2]}
        </span>
      );
    } else if (match[3] === '**') {
      parts.push(
        <span key={`${keyPrefix}-b-${match.index}`} style={{ fontWeight: 'bold' }}>
          {match[4]}
        </span>
      );
    } else if (match[5] === '*') {
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

interface ParsedTextProps {
  html: string;
}

export function ParsedText({ html }: ParsedTextProps) {
  if (!html) return null;

  const locale = useCardStore((s) => s.locale);
  const expanded = expandVariables(html, getVariables(locale));
  const plain = stripHtml(expanded);
  const segments = parseSegments(plain);

  return (
    <span>
      {renderSegments(segments, '')}
    </span>
  );
}
