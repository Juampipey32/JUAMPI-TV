// Spatial navigation uses the nearest element in the direction of the remote key.
export function nextTarget(current, candidates, direction) {
  const horizontal = direction === 'ArrowLeft' || direction === 'ArrowRight';
  const sign = direction === 'ArrowLeft' || direction === 'ArrowUp' ? -1 : 1;
  const cx = current.left + current.width / 2, cy = current.top + current.height / 2;
  let best = null, score = Infinity;
  for (const item of candidates) {
    const r = item.rect, dx = r.left + r.width / 2 - cx, dy = r.top + r.height / 2 - cy;
    const primary = (horizontal ? dx : dy) * sign;
    if (primary < 4) continue;
    const cross = Math.abs(horizontal ? dy : dx);
    const overlap = horizontal ? r.top < current.bottom && r.bottom > current.top : r.left < current.right && r.right > current.left;
    const cost = primary + cross * 3 + (overlap ? 0 : 1500);
    if (cost < score) { score = cost; best = item.element; }
  }
  return best;
}

export function installTVNavigation() {
  const focusables = () => [...(document.querySelector('dialog[open]') || document).querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled)')].filter(el => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
  });
  document.addEventListener('keydown', event => {
    if (!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)) return;
    const current = document.activeElement;
    if (current.tagName === 'SELECT') return;
    if (current.tagName === 'INPUT' && ['ArrowLeft','ArrowRight'].includes(event.key)) return;
    const list = focusables();
    let next;
    if (!list.includes(current)) next = list[0];
    else next = nextTarget(current.getBoundingClientRect(),list.filter(el=>el!==current).map(element=>({element,rect:element.getBoundingClientRect()})),event.key);
    event.preventDefault();
    if (next) { next.focus({preventScroll:true}); next.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'}); }
  });
  requestAnimationFrame(()=>document.querySelector('#explore')?.focus({preventScroll:true}));
}
