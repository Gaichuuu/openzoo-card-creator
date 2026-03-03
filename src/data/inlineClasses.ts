import type { CSSProperties } from 'react';
import { ELEMENTS, TERRAS, TRAITS } from './constants';
import type { Locale } from './locales';
import { getPSBVariable } from './locales';

export const INLINE_CLASSES: Record<string, CSSProperties> = {
  LP: {
    fontSize: '0.40em',
    display: 'inline',
    color: 'inherit',
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
    height: '1.6em',
    lineHeight: '0',
    textTransform: 'uppercase' as const,
    fontSize: '0.7em',
    boxShadow: '0px 0.5px 1px rgba(0, 0, 0, 0.25)',
    textShadow: [
      '0.15em 0em 0em rgba(0,0,0,1)',
      '0.138em 0.058em 0em rgba(0,0,0,1)',
      '0.106em 0.106em 0em rgba(0,0,0,1)',
      '0.058em 0.138em 0em rgba(0,0,0,1)',
      '0em 0.15em 0em rgba(0,0,0,1)',
      '-0.058em 0.138em 0em rgba(0,0,0,1)',
      '-0.106em 0.106em 0em rgba(0,0,0,1)',
      '-0.138em 0.058em 0em rgba(0,0,0,1)',
      '-0.15em 0em 0em rgba(0,0,0,1)',
      '-0.138em -0.058em 0em rgba(0,0,0,1)',
      '-0.106em -0.106em 0em rgba(0,0,0,1)',
      '-0.058em -0.138em 0em rgba(0,0,0,1)',
      '0em -0.15em 0em rgba(0,0,0,1)',
      '0.058em -0.138em 0em rgba(0,0,0,1)',
      '0.106em -0.106em 0em rgba(0,0,0,1)',
      '0.138em -0.058em 0em rgba(0,0,0,1)',
    ].join(', '),
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
