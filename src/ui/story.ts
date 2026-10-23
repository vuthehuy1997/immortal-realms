import { el } from './dom';
import { $ } from './dom';

/** Automated browsers (Playwright sets navigator.webdriver) skip story pages so gameplay tests are not blocked; `?story=1` forces them. */
export function storySkippedByAutomation(): boolean {
  try {
    if (new URLSearchParams(location.search).get('story') === '1') return false;
    return navigator.webdriver === true;
  } catch { return false; }
}

let open = false;
export const isStoryOpen = (): boolean => open;

/** Full-screen story pages (prologue / chapter intro). Enter or click advances; Esc or Skip closes. */
export function showStory(opts: { subtitle: string; title: string; pages: string[]; onDone(): void }): void {
  if (storySkippedByAutomation() || opts.pages.length === 0) { opts.onDone(); return; }
  document.getElementById('story')?.remove();
  const root = el('div', 'story'); root.id = 'story';
  let i = 0;
  const finish = () => { if (!open) return; open = false; window.removeEventListener('keydown', onKey, true); root.remove(); opts.onDone(); };
  const render = () => {
    root.innerHTML = `<div class="storybox"><div class="chap">${opts.subtitle}</div><h2>${opts.title}</h2><p id="story-text">${opts.pages[i]}</p>
      <div class="storybtns"><button class="menu-btn" id="story-next">${i < opts.pages.length - 1 ? 'Continue' : 'Begin'}</button><button class="menu-btn quiet" id="story-skip">Skip</button></div>
      <div class="dots">${opts.pages.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div></div>`;
    $('story-next').onclick = next; $('story-skip').onclick = finish; $('story-next').focus();
  };
  const next = () => { if (i < opts.pages.length - 1) { i++; render(); } else finish(); };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); next(); }
  };
  open = true;
  window.addEventListener('keydown', onKey, true);
  $('ui').appendChild(root); render();
}
