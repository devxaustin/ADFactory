// Left/right project carousel. Swiping is native scroll-snap; this adds the
// arrow buttons, keyboard arrows, the counter, and which slide is lit.
const track = document.querySelector<HTMLElement>('.track');

if (track) {
  const slides = Array.from(track.querySelectorAll<HTMLElement>('.slide'));
  const prev = document.querySelector<HTMLButtonElement>('[data-deck-prev]');
  const next = document.querySelector<HTMLButtonElement>('[data-deck-next]');
  const count = document.querySelector<HTMLElement>('[data-deck-count]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const pad = (n: number) => String(n).padStart(2, '0');

  let index = 0;

  const centerOf = (i: number) => {
    const s = slides[i];
    return s.offsetLeft - (track.clientWidth - s.clientWidth) / 2;
  };

  function update() {
    const mid = track!.scrollLeft + track!.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    slides.forEach((s, i) => {
      const d = Math.abs(s.offsetLeft + s.clientWidth / 2 - mid);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    index = best;
    slides.forEach((s, i) => s.classList.toggle('is-active', i === index));
    if (count) count.textContent = `${pad(index + 1)} / ${pad(slides.length)}`;
    if (prev) prev.disabled = index === 0;
    if (next) next.disabled = index === slides.length - 1;
  }

  function goTo(i: number) {
    const target = Math.max(0, Math.min(slides.length - 1, i));
    track!.scrollTo({ left: centerOf(target), behavior: reduce.matches ? 'auto' : 'smooth' });
  }

  let ticking = false;
  track.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        update();
      });
    },
    { passive: true },
  );

  prev?.addEventListener('click', () => goTo(index - 1));
  next?.addEventListener('click', () => goTo(index + 1));

  document.addEventListener('keydown', (e) => {
    if (document.documentElement.dataset.pane !== 'projects') return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if ((e.target as HTMLElement | null)?.closest('input, textarea, select')) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goTo(index - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goTo(index + 1);
    }
  });

  // A hidden pane loses its scroll position, so put it back when it returns.
  document.addEventListener('pane:change', (e) => {
    if ((e as CustomEvent).detail.name !== 'projects') return;
    requestAnimationFrame(() => {
      track.scrollTo({ left: centerOf(index), behavior: 'auto' });
      update();
    });
  });
  window.addEventListener('resize', () => {
    track.scrollTo({ left: centerOf(index), behavior: 'auto' });
    update();
  });

  update();
}
