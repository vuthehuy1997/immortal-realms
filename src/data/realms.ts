export interface RealmDef { id: string; name: string; qiMax: number; statMult: number }

/** Slice: Qi Condensation 1-3. Later realms are future content. */
export const REALMS: readonly RealmDef[] = [
  { id: 'qc1', name: 'Qi Condensation I', qiMax: 100, statMult: 1.0 },
  { id: 'qc2', name: 'Qi Condensation II', qiMax: 250, statMult: 1.15 },
  { id: 'qc3', name: 'Qi Condensation III', qiMax: 500, statMult: 1.35 },
];
