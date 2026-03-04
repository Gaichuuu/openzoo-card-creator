import { INLINE_CLASSES } from '@/data/inlineClasses';

export type Segment =
  | { type: 'text'; content: string }
  | { type: 'class'; className: string; content: string }
  | { type: 'image'; content: string };

export function expandVariables(text: string, variables: Record<string, string>): string {
  if (!text.includes('{')) return text;
  let result = text;
  for (const [varName, varValue] of Object.entries(variables)) {
    result = result.replaceAll(`{${varName}}`, varValue);
  }
  return result;
}

export function isInlineImage(content: string): boolean {
  return content.includes('.png') || content.includes('.jpg') || content.includes('.webp');
}

export function parseSegments(text: string): Segment[] {
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

    if (isInlineImage(braceContent)) {
      segments.push({ type: 'image', content: braceContent });
      i = j;
      continue;
    }

    segments.push({ type: 'text', content: text.slice(braceStart, j) });
    i = j;
  }

  return segments;
}

export function stripParagraphWrap(v: string): string {
  return v.replace(/^<p>/, '').replace(/<\/p>$/, '');
}

export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p>/gi, '\n')
    .replace(/<\/?p>/gi, '')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .trim();
}
