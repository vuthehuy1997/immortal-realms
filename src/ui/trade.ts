import { canCraft, RECIPES } from '../core/alchemy';
import { countOf } from '../core/inventory';
import type { GameState } from '../core/gameState';
import { SHOP_STOCK, sellValue } from '../core/shop';
import { ITEMS, RARITY_COLOR } from '../data/items';
import { $, el } from './dom';
import { itemIconHtml, portraitUrl } from './skin';

export type TradeKind = 'shop' | 'alchemy';
export interface TradeActions { buy(id: string): void; sell(slot: number): void; craft(id: string): void; close(): void }

let current: { kind: TradeKind; actions: TradeActions } | null = null;
export const isTradeOpen = (): boolean => current !== null;

function ensure(): HTMLElement {
  let box = document.getElementById('trade');
  if (!box) { box = el('div', 'panel hidden'); box.id = 'trade'; $('ui').appendChild(box); }
  return box;
}

const iconBox = (id: string): string => `<div class="tico" style="border-color:${RARITY_COLOR[ITEMS[id]!.rarity]}">${itemIconHtml(id, 36)}</div>`;

export function showTrade(kind: TradeKind, gs: GameState, actions: TradeActions): void {
  current = { kind, actions };
  ensure().classList.remove('hidden');
  renderTrade(gs);
}

export function closeTrade(): void { current = null; document.getElementById('trade')?.classList.add('hidden'); }

/** Re-renders the open trade window (call after every purchase/sale/craft). */
export function renderTrade(gs: GameState): void {
  if (!current) return;
  const box = ensure(); const { kind, actions } = current;
  const pic = portraitUrl(kind === 'shop' ? 'peddler_neutral' : 'alchemist_neutral');
  const title = kind === 'shop' ? 'Merchant Qiao' : 'Alchemist Yun';
  const blurb = kind === 'shop' ? 'Spirit stones for steel and draughts, friend.' : 'Bring me lingzhi and a few stones, and I will brew what you need.';
  let body = '';
  if (kind === 'shop') {
    body += '<div class="tcols"><div><h4>Buy</h4>' + SHOP_STOCK.map((e) => {
      const d = ITEMS[e.id]!, can = gs.stones >= e.price;
      return `<div class="trow">${iconBox(e.id)}<div class="tx"><b style="color:${RARITY_COLOR[d.rarity]}">${d.name}</b><small>${d.description}</small></div><button class="btn" data-buy="${e.id}" ${can ? '' : 'disabled'}>${e.price} ◆</button></div>`;
    }).join('') + '</div><div><h4>Sell</h4>';
    const rows = gs.inventory.slots.map((s, i) => s && { s, i }).filter(Boolean) as { s: { id: string; count: number }; i: number }[];
    body += rows.length ? rows.map(({ s, i }) => {
      const d = ITEMS[s.id]!;
      return `<div class="trow">${iconBox(s.id)}<div class="tx"><b style="color:${RARITY_COLOR[d.rarity]}">${d.name}${s.count > 1 ? ` ×${s.count}` : ''}</b><small>${d.description}</small></div><button class="btn" data-sell="${i}">+${sellValue(s.id)} ◆</button></div>`;
    }).join('') : '<div class="empty">Your bag is empty.</div>';
    body += '</div></div>';
  } else {
    body += '<h4>Furnace</h4>' + RECIPES.map((r) => {
      const d = ITEMS[r.output]!, can = canCraft(gs, r), herbs = countOf(gs.inventory, 'spirit-herb');
      return `<div class="trow">${iconBox(r.output)}<div class="tx"><b style="color:${RARITY_COLOR[d.rarity]}">${r.name}</b><small>${r.note} · needs ${r.herbs} Spirit Herb (${herbs} owned) + ${r.stones} ◆</small></div><button class="btn" data-craft="${r.id}" ${can ? '' : 'disabled'}>Brew</button></div>`;
    }).join('');
  }
  box.innerHTML = `<div class="thead">${pic ? `<img class="portrait" src="${pic}" alt="">` : ''}<div><div class="who">${title}</div><div class="txt">${blurb}</div><div class="purse">◆ <span id="purse">${gs.stones}</span> spirit stones</div></div></div>${body}<div class="tfoot"><button class="btn" id="trade-close">Close (Esc)</button></div>`;
  box.querySelectorAll<HTMLButtonElement>('[data-buy]').forEach((b) => { b.onclick = () => actions.buy(b.dataset.buy!); });
  box.querySelectorAll<HTMLButtonElement>('[data-sell]').forEach((b) => { b.onclick = () => actions.sell(Number(b.dataset.sell)); });
  box.querySelectorAll<HTMLButtonElement>('[data-craft]').forEach((b) => { b.onclick = () => actions.craft(b.dataset.craft!); });
  $('trade-close').onclick = () => actions.close();
}
