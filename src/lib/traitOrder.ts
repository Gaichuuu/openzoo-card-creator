export const TRAIT_ORDER: readonly string[] = [
  'Ambush',
  'Trap', 'Equipment',
  'Fear', 'Flash', 'Fleet',
  'Blood Sucker', 'Burrow', 'Convert', 'Defender', 'Destroyer', 'First Strike',
  'Flight', 'Immortal', 'Infectious', 'Invisible', 'Legend', 'Magiproof', 'Regen',
  'Self Destruct', 'Spectral', 'Stone Skin', 'Unblockable', 'Veiled', 'Venomous',
];

function traitRank(name: string): number {
  const i = TRAIT_ORDER.indexOf(name);
  return i >= 0 ? i : TRAIT_ORDER.length;
}

export function sortTraits<T extends string | null>(traits: readonly T[]): T[] {
  const named = traits.filter((t): t is NonNullable<T> => !!t);
  named.sort((a, b) => traitRank(a) - traitRank(b) || (traitRank(a) === TRAIT_ORDER.length ? a.localeCompare(b) : 0));
  return [...named, ...traits.slice(named.length).map(() => null as T)];
}
