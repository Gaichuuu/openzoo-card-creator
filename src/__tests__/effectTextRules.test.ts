import { describe, it, expect } from 'vitest'
import { fixEffectText, findEffectTextViolations } from '../lib/effectTextRules'

describe('status-duration', () => {
  it('tightens a spaced Status duration and leaves the value plain', () => {
    expect(fixEffectText('inflicted with {Frozen} (X) where')).toBe('inflicted with {Frozen}(X) where')
    expect(fixEffectText('inflicted with {Frozen} (2)')).toBe('inflicted with {Frozen}(2)')
  })

  it('tightens the bracket form and an already bolded value', () => {
    expect(fixEffectText('inflicted with [Frozen] (2)')).toBe('inflicted with [Frozen](2)')
    expect(fixEffectText('inflicted with {Frozen} ({B:X}) where')).toBe('inflicted with {Frozen}(X) where')
  })

  it('attaches X to the number it multiplies', () => {
    expect(fixEffectText('maximum LP is equal to 10 {B:X} the number')).toBe('maximum LP is equal to 10{B:X} the number')
  })

  it('leaves an already tight duration alone', () => {
    expect(fixEffectText('{Frozen}(2) ends')).toBe('{Frozen}(2) ends')
  })
})

describe('fixEffectText', () => {
  it('bolds Damage and LP amounts, including inside Token stat lines', () => {
    expect(fixEffectText('a Beastie Token with 10 LP and a 10 Damage Attack')).toBe(
      'a Beastie Token with {B:10 LP} and a {B:10 Damage} Attack',
    )
  })

  it('bolds signed amounts and ATK DMG', () => {
    expect(fixEffectText('gains +15 Damage and +10 LP')).toBe(
      'gains {B:+15 Damage} and {B:+10 LP}',
    )
    expect(fixEffectText('deals 50 ATK DMG')).toBe('deals {B:50 ATK DMG}')
  })

  it('bolds the variable X and its coefficient forms', () => {
    expect(fixEffectText('Place X Beasties into Limbo')).toBe(
      'Place {B:X} Beasties into Limbo',
    )
    expect(fixEffectText('is dealt 25X Damage')).toBe('is dealt {B:25X Damage}')
    expect(fixEffectText('is dealt {B:25X} Damage')).toBe('is dealt {B:25X Damage}')
    expect(fixEffectText('adds +X Damage')).toBe('adds {B:+X Damage}')
  })

  it('bolds Aura amounts, Page counts and Counter counts', () => {
    expect(fixEffectText('you may pay 1 {Dark}')).toBe('you may pay {B:1} {Dark}')
    expect(fixEffectText('all Spells cost 1 less {Flame}')).toBe(
      'all Spells cost {B:1} less {Flame}',
    )
    expect(fixEffectText('costs 0 Aura to Contract')).toBe(
      'costs {B:0} Aura to Contract',
    )
    expect(fixEffectText('with an Aura Cost of 4')).toBe(
      'with an Aura Cost of {B:4}',
    )
    expect(fixEffectText('look at the top 7 Pages')).toBe(
      'look at the top {B:7} Pages',
    )
    expect(fixEffectText('Place 1 Spark Counter on target Beastie.')).toBe(
      'Place {B:1} Spark Counter on target Beastie.',
    )
    expect(fixEffectText('Bookmark 2 Pages')).toBe('Bookmark {B:2} Pages')
  })

  it('bolds Aura amounts with no element icon, a capitalised verb, or carried by "and"', () => {
    expect(fixEffectText('to generate 1 Aura of any type.')).toBe(
      'to generate {B:1} Aura of any type.',
    )
    expect(fixEffectText('Generate 1 {Lightning} Aura and awaken.')).toBe(
      'Generate {B:1} {Lightning} Aura and awaken.',
    )
    expect(fixEffectText('generate 1 {Flame} Aura and 1 {Lightning} Aura.')).toBe(
      'generate {B:1} {Flame} Aura and {B:1} {Lightning} Aura.',
    )
    expect(fixEffectText('Destroy target Beastie and 2 Artifacts.')).toBe(
      'Destroy target Beastie and 2 Artifacts.',
    )
  })

  it('bolds an Aura Cost stated as a number followed by an element icon', () => {
    expect(fixEffectText('This Page costs 1 {Light} Aura to Contract.')).toBe(
      'This Page costs {B:1} {Light} Aura to Contract.',
    )
    expect(fixEffectText('Spells cost 1 {Dark} to Contract')).toBe(
      'Spells cost {B:1} {Dark} to Contract',
    )
    expect(fixEffectText('costs 3 less {Forest} Aura')).toBe('costs {B:3} less {Forest} Aura')
  })

  it('bolds counts of Tokens created', () => {
    expect(fixEffectText('generate 1 Beastie Zombie Token with 10 LP')).toBe(
      'generate {B:1} Beastie Zombie Token with {B:10 LP}',
    )
    expect(fixEffectText('Create 5 Example Tokens')).toBe('Create {B:5} Example Tokens')
    expect(fixEffectText('place a {Lightning} Beastie Token')).toBe(
      'place a {Lightning} Beastie Token',
    )
    expect(fixEffectText('Destroy 2 Beasties and the Token')).toBe(
      'Destroy 2 Beasties and the Token',
    )
  })

  it('bolds a Damage floor but not a multiplier', () => {
    expect(fixEffectText('reduce the Damage dealt to 0.')).toBe(
      'reduce the Damage dealt to {B:0}.',
    )
    expect(fixEffectText('Damage is equal to 10 times the number of Beasties')).toBe(
      'Damage is equal to 10 times the number of Beasties',
    )
  })

  it('leaves Status Effect durations plain', () => {
    expect(fixEffectText('is inflicted with {Frozen}(2)')).toBe(
      'is inflicted with {Frozen}(2)',
    )
    expect(fixEffectText('is inflicted with {Frozen}(X) where X is your age')).toBe(
      'is inflicted with {Frozen}(X) where {B:X} is your age',
    )
  })

  it('leaves real-world quantities and Die Roll outcomes plain', () => {
    const flavor =
      'If the forecast predicts a 75% or higher chance of rain within 5 miles, and the Die Roll is a 1 or a 2'
    expect(fixEffectText(flavor)).toBe(flavor)
    expect(fixEffectText('If it is above 100°F at your location')).toBe(
      'If it is above 100°F at your location',
    )
  })

  it('leaves list enumerators plain', () => {
    expect(fixEffectText('choose an Effect:\n1. Draw\n2. Discard')).toBe(
      'choose an Effect:\n1. Draw\n2. Discard',
    )
  })

  it('does not re-bold text that is already correct', () => {
    const done = 'gains {B:+15 Damage} and pays {B:1} {Dark}'
    expect(fixEffectText(done)).toBe(done)
  })

  it('is idempotent', () => {
    const raw = 'Token with 10 LP and a 10 Damage Attack, pay 1 {Dark}, reduce to 0.'
    const once = fixEffectText(raw)
    expect(fixEffectText(once)).toBe(once)
  })

  it('narrows a bold span that swallowed a noun, and unbolds a bare unit', () => {
    expect(fixEffectText('a {B:5 Damage Attack} into the Arena')).toBe(
      'a {B:5 Damage} Attack into the Arena',
    )
    expect(fixEffectText('double their {B:Life Points}')).toBe('double their LP')
    expect(fixEffectText('maximum {B:LP} is equal')).toBe('maximum LP is equal')
  })

  it('bolds a Terra Bonus increase and normalizes a spaced sign', () => {
    expect(fixEffectText('they gain ({Desert} +25)')).toBe('they gain ({Desert} {B:+25})')
    expect(fixEffectText('gain ({Lightning Storm} + 10)')).toBe(
      'gain ({Lightning Storm} {B:+10})',
    )
  })

  it('writes Die Roll and Coin Flip out, since neither has an icon', () => {
    expect(fixEffectText('target a Caster and roll a DICE.')).toBe(
      'target a Caster and Die Roll.',
    )
    expect(fixEffectText('If the DICE roll is a 1 or a 2')).toBe(
      'If the Die Roll is a 1 or a 2',
    )
    expect(fixEffectText('the next COIN FLIP or DICE rolled')).toBe(
      'the next Coin Flip or Die Roll',
    )
    expect(fixEffectText('you would FLIP COIN or roll a DICE')).toBe(
      'you would Coin Flip or Die Roll',
    )
    expect(fixEffectText('the results of any DICE or COIN FLIP')).toBe(
      'the results of any Die Roll or Coin Flip',
    )
  })

  it('leaves a real coin used as a prop alone', () => {
    const prop = 'any opposing Caster may place a real coin on this Page to Fatigue it.'
    expect(fixEffectText(prop)).toBe(prop)
  })

  it('leaves Page and Attack names alone', () => {
    const names = '{BI:Joint Snake} uses {B:Fanged Strike} on {BI:"Cat"} Pages'
    expect(fixEffectText(names)).toBe(names)
  })
})

describe('findEffectTextViolations', () => {
  it('reports nothing for conforming text', () => {
    expect(findEffectTextViolations('gains {B:+15 Damage}.')).toEqual([])
  })

  it('names the rule and the replacement', () => {
    expect(findEffectTextViolations('a 10 Damage Attack')).toEqual([
      { rule: 'damage-amount', match: '10 Damage', fix: '{B:10 Damage}' },
    ])
  })
})

describe('data/cards corpus', () => {
  const cards = import.meta.glob('../../data/cards/**/*.json', { eager: true }) as Record<
    string,
    { default: { effectBlocks?: Array<Record<string, unknown>> } }
  >

  it('has conforming effect-text markup in every card', () => {
    const offenders: string[] = []
    for (const [path, module] of Object.entries(cards)) {
      if (path.includes('/old/')) continue
      for (const block of module.default.effectBlocks ?? []) {
        for (const key of ['text', 'attackEffect'] as const) {
          const text = block[key]
          if (typeof text !== 'string' || !text) continue
          for (const v of findEffectTextViolations(text)) {
            offenders.push(`${path.replace('../../', '')} [${v.rule}] ${v.match} -> ${v.fix}`)
          }
        }
      }
    }
    expect(offenders).toEqual([])
  })
})
