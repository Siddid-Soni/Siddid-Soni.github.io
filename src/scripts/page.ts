import { formatClock, progressFromSections, sampleTimeline } from '../scene/timeline';

declare global { interface Window { __portfolio: { f: number } } }

export function initPage() {
  const root = document.documentElement;
  const sections = [...document.querySelectorAll<HTMLElement>('.sec')];
  const clock = document.getElementById('clock');
  const scrub = [...document.querySelectorAll<HTMLAnchorElement>('.scrubber a')];
  const room = document.getElementById('room');
  const stills = [...document.querySelectorAll<HTMLElement>('.still')];
  let tops: number[] = [];
  let theme = root.dataset.theme ?? 'day';
  let active = -1;
  let queued = false;
  window.__portfolio = { f: 0 };

  const measure = () => { tops = sections.map((s) => s.offsetTop); };
  const update = () => {
    queued = false;
    const max = root.scrollHeight - innerHeight;
    const f = progressFromSections(scrollY, tops, max);
    window.__portfolio.f = f;
    const s = sampleTimeline(f);
    dispatchEvent(new CustomEvent('portfolio:progress', { detail: { f } }));
    if (clock) clock.textContent = formatClock(s.clockMinutes);
    if (s.theme !== theme) {
      theme = s.theme;
      root.dataset.theme = theme;
      dispatchEvent(new CustomEvent('portfolio:theme', { detail: { theme } }));
    }
    if (s.index !== active) {
      active = s.index;
      scrub.forEach((a, i) => (i === active ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    }
    if (room?.classList.contains('fallback')) {
      stills.forEach((el, i) => { el.style.opacity = String(Math.max(0, 1 - Math.abs(f - i))); });
    }
  };
  const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };

  measure();
  update();
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', () => { measure(); schedule(); });
  new ResizeObserver(() => { measure(); schedule(); }).observe(document.body);
  if (room) new MutationObserver(schedule).observe(room, { attributes: true, attributeFilter: ['class'] });

  const focus = (slug: string | null) => dispatchEvent(new CustomEvent('portfolio:project-focus', { detail: { slug } }));
  document.querySelectorAll<HTMLElement>('[data-project]').forEach((el) => {
    const slug = el.dataset.project!;
    el.addEventListener('pointerenter', () => focus(slug));
    el.addEventListener('pointerleave', () => focus(null));
    el.addEventListener('focusin', () => focus(slug));
    el.addEventListener('focusout', () => focus(null));
  });
}
