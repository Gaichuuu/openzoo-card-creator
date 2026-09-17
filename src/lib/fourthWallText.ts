const STAR = '{Star}';
const KEYWORD_PREFIX = /^\*\*[^*]+\*\*\s*/;

export function hasFourthWall(text: string): boolean {
  return text.trimStart().startsWith(STAR);
}

function isWholeItalic(text: string): boolean {
  if (!text.startsWith('{I:') || !text.endsWith('}')) return false;
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}' && --depth === 0) return i === text.length - 1;
  }
  return false;
}

export function setFourthWall(text: string, on: boolean, italicize: boolean): string {
  const lead = text.slice(0, text.length - text.trimStart().length);
  const trimmed = text.slice(lead.length);
  if (on === hasFourthWall(trimmed)) return text;
  const unstarred = on ? trimmed : trimmed.slice(STAR.length);
  const keyword = unstarred.match(KEYWORD_PREFIX)?.[0] ?? '';
  let body = unstarred.slice(keyword.length);
  if (on && italicize && body && !isWholeItalic(body)) body = `{I:${body}}`;
  return lead + (on ? `${STAR}${keyword}${body}` : `${keyword}${body}`);
}
