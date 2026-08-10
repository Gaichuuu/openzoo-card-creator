import type { CSSProperties } from 'react';
import { ELEMENTS, TERRAS, TRAITS } from './constants';
import type { Locale } from './locales';
import { getPSBVariable } from './locales';
import type { OutlineStyle } from '@/lib/outlineUtils';

export const INLINE_CLASSES: Record<string, CSSProperties> = {
  LP: {
    fontSize: '0.40em',
    display: 'inline',
    color: 'inherit',
    letterSpacing: '0.01em',
  },
  TTL: {
    fontSize: '0.81em',
    display: 'inline',
    color: 'inherit',
  },
  B: {
    fontWeight: 'bold',
    display: 'inline',
    color: 'inherit',
  },
  SC: {
    fontSize: '0.85em',
    display: 'inline',
    color: 'inherit',
  },
  I: {
    fontStyle: 'italic',
    display: 'inline',
    color: 'inherit',
  },
  BI: {
    fontWeight: 'bold',
    fontStyle: 'italic',
    display: 'inline',
    color: 'inherit',
  },
  R: {
    fontStyle: 'normal',
    fontWeight: 'normal',
    display: 'inline',
    color: 'inherit',
  },
  RB: {
    fontStyle: 'normal',
    fontWeight: 'bold',
    display: 'inline',
    color: 'inherit',
  },
  Num: {
    fontSize: '0.7em',
    fontWeight: 'bold',
    display: 'inline',
    color: 'inherit',
    paddingLeft: '0.2em',
  },
  Power: {
    paddingLeft: '0.3em',
    paddingRight: '0.3em',
    borderStyle: 'solid',
    borderColor: 'rgba(0, 0, 0, 1)',
    borderWidth: '0.2em',
    borderRadius: '2em',
    backgroundColor: 'rgba(155, 180, 216, 1)',
    color: 'rgba(255, 255, 255, 1)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    verticalAlign: '0.2em',
    marginTop: '0.15em',
    height: 'auto',
    lineHeight: '1',
    paddingTop: '0.15em',
    paddingBottom: '0.15em',
    textTransform: 'uppercase' as const,
    fontSize: '0.7em',
    boxShadow: '0px 0.5px 1px rgba(0, 0, 0, 0.25)',
  },
};

export const INLINE_CLASS_OUTLINES: Record<string, OutlineStyle> = {
  Power: {
    WebkitTextStrokeWidth: '0.3em',
    WebkitTextStrokeColor: 'rgba(0, 0, 0, 1)',
    paintOrder: 'stroke fill',
  },
};

const BASE_VARIABLES: Record<string, string> = {
  Star: '{4thWallStar.png, 0.9, 0.1}',
  LP: '{LP:LP}',
};

for (const element of ELEMENTS) {
  BASE_VARIABLES[element] = `{OpenZoo Aura/${element}.png, 0.9, 0.1}`;
}
for (const terra of TERRAS) {
  BASE_VARIABLES[terra] = `{OpenZoo Terra/${terra}.png, 0.9, 0.1}`;
}
for (const trait of TRAITS) {
  BASE_VARIABLES[trait] = `{OpenZoo Traits/${trait}.png, 0.9, 0.1}`;
}

const CACHED_VARIABLES: Partial<Record<Locale, Record<string, string>>> = {};

export function getVariables(locale: Locale): Record<string, string> {
  if (!CACHED_VARIABLES[locale]) {
    CACHED_VARIABLES[locale] = { ...BASE_VARIABLES, PSB: getPSBVariable(locale) };
  }
  return CACHED_VARIABLES[locale];
}
