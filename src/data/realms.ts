export interface RealmDef { id: string; name: string; qiMax: number; statMult: number; /** character level needed to break through INTO this realm */ reqLevel: number }

/** Qi Condensation 1-3 and Foundation Establishment. Later realms are future content. */
export const REALMS: readonly RealmDef[] = [
  { id: 'qc1', name: 'Qi Condensation I', qiMax: 120, statMult: 1.0, reqLevel: 1 },
  { id: 'qc2', name: 'Qi Condensation II', qiMax: 400, statMult: 1.15, reqLevel: 5 },
  { id: 'qc3', name: 'Qi Condensation III', qiMax: 1000, statMult: 1.35, reqLevel: 10 },
  { id: 'fe1', name: 'Foundation Establishment', qiMax: 2400, statMult: 1.65, reqLevel: 20 },
];
