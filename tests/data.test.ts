import { describe, expect, it } from 'vitest';
import { ITEM_ICON } from '../src/data/icons';
import { ITEMS } from '../src/data/items';
import manifest from '../src/data/manifest.generated.json';

describe('item data', () => {
  it('every item has an icon that exists in the manifest (round-7 regression: dragon items were blank)', () => {
    for (const id of Object.keys(ITEMS)) {
      const ic = ITEM_ICON[id];
      expect(ic, `${id} has no icon`).toBeDefined();
      const table = ic!.kind === 'ui' ? manifest.ui : manifest.icons;
      expect((table as Record<string, unknown>)[ic!.key], `${id} -> ${ic!.key}`).toBeDefined();
    }
  });
});
