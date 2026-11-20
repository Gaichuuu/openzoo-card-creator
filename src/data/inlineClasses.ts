import type { CSSProperties } from 'react';
import { ELEMENTS, TERRAS, TRAITS, STATUS_EFFECTS, POWER_PILL_EM, ATTACK_ZONE_PX, ADV_TRIM, SPECIAL_TEXT_FONT_PX, DAMAGE_RED, dividerGradient } from './constants';
import type { Locale } from './locales';
import { getPSBVariable } from './locales';
import type { OutlineStyle } from '@/lib/outlineUtils';

export const PILL_VARS = {
  fill: '--oz-pill-fill',
  fillImage: '--oz-pill-fill-image',
  border: '--oz-pill-border',
  text: '--oz-pill-text',
  outline: '--oz-pill-outline',
} as const;

const boxEm = (px: number) => `${Number((px / SPECIAL_TEXT_FONT_PX).toFixed(4))}em`;

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
    borderColor: `var(${PILL_VARS.border}, rgba(0, 0, 0, 1))`,
    borderWidth: '1px',
    borderRadius: '2em',
    backgroundColor: `var(${PILL_VARS.fill}, rgba(155, 180, 216, 1))`,
    backgroundImage: `var(${PILL_VARS.fillImage}, none)`,
    color: `var(${PILL_VARS.text}, rgba(255, 255, 255, 1))`,
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
    fontSize: `${POWER_PILL_EM}em`,
    boxShadow: '0px 0.5px 1px rgba(0, 0, 0, 0.25)',
  },
  AtkRow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '0.3em',
  },
  AtkName: {
    display: 'inline',
    fontWeight: 'bold',
    fontSize: boxEm(ATTACK_ZONE_PX.name),
    textTransform: 'uppercase' as const,
  },
  AtkDmg: {
    display: 'inline',
    fontWeight: 'bold',
    fontSize: boxEm(ATTACK_ZONE_PX.damage),
    lineHeight: '1',
    color: DAMAGE_RED,
  },
  AtkAdv: {
    display: 'inline-flex',
    fontSize: boxEm(ATTACK_ZONE_PX.advantage * ADV_TRIM),
    lineHeight: '0',
    outline: '1px solid rgba(0, 0, 0, 1)',
    outlineOffset: '-1px',
  },
  AtkDiv: {
    display: 'block',
    width: '21em',
    maxWidth: '100%',
    height: '1px',
    margin: '0.3em auto',
    background: dividerGradient('var(--oz-atk-div, #000)', 'transparent'),
  },
  AtkEffect: {
    display: 'block',
  },
};

export const INLINE_CLASS_OUTLINES: Record<string, OutlineStyle> = {
  Power: {
    WebkitTextStrokeWidth: '0.3em',
    WebkitTextStrokeColor: `var(${PILL_VARS.outline}, rgba(0, 0, 0, 1))`,
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
for (const status of STATUS_EFFECTS) {
  BASE_VARIABLES[status] = `{OpenZoo Status Effects/${status}.png, 0.9, 0.1}`;
}

const CACHED_VARIABLES: Partial<Record<Locale, Record<string, string>>> = {};

export function getVariables(locale: Locale): Record<string, string> {
  if (!CACHED_VARIABLES[locale]) {
    CACHED_VARIABLES[locale] = { ...BASE_VARIABLES, PSB: getPSBVariable(locale) };
  }
  return CACHED_VARIABLES[locale];
}
