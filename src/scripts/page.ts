import { formatClock, progressFromSections, sampleTimeline } from '../scene/timeline';

declare global { interface Window { __portfolio: { f: number } } }

export function initPage() {
  const root = document.documentElement;
  const sections = [...document.querySelectorAll<HTMLElement>('.sec')];
  const clock = document.getElementById('clock');
  const clockTime = document.getElementById('clock-time');
  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  const scrub = [...document.querySelectorAll<HTMLAnchorElement>('.scrubber a')];
  const room = document.getElementById('room');
  const stills = [...document.querySelectorAll<HTMLElement>('.still')];
  const scrims = (['l', 'r', 'c'] as const).map((k) => [k, document.querySelector<HTMLElement>(`.scrim-${k}`)] as const);
  const aligns = sections.map((s) => (s.classList.contains('sec--right') ? 'r' : s.classList.contains('sec--center') ? 'c' : 'l'));
  let tops: number[] = [];
  let ramp = Infinity;
  let theme = root.dataset.theme ?? 'day';
  let active = -1;
  let queued = false;
  let sceneBg = '';
  window.__portfolio = { f: 0 };

  const phone = matchMedia('(max-width: 759px)');
  // On phones the copy starts below the pinned room card, so a section "arrives" when it reaches the card's bottom edge.
  // Sections there run long, so each holds its shot while it's read and the room moves on only as the next heading
  // climbs the last half of the reading area.
  const measure = () => {
    const lead = phone.matches && room ? room.getBoundingClientRect().bottom + 12 : 0;
    tops = sections.map((s) => Math.max(0, s.offsetTop - lead));
    ramp = phone.matches ? Math.max(120, (innerHeight - lead) * 0.5) : Infinity;
  };
  const update = () => {
    queued = false;
    const max = root.scrollHeight - innerHeight;
    const f = progressFromSections(scrollY, tops, max, ramp);
    window.__portfolio.f = f;
    const s = sampleTimeline(f);
    dispatchEvent(new CustomEvent('portfolio:progress', { detail: { f } }));
    const w = { l: 0, r: 0, c: 0 };
    aligns.forEach((a, i) => { w[a] += Math.max(0, 1 - Math.abs(f - i)); });
    for (const [k, el] of scrims) {
      root.style.setProperty(`--scrim-${k}`, w[k].toFixed(3));
      if (el) el.style.visibility = w[k] > 0.001 ? '' : 'hidden'; // a hidden layer skips its backdrop blur
    }
    root.style.setProperty('--f', f.toFixed(3)); // drives the sun/moon on the time rail
    // The scrim, header band and browser chrome take the scene's own sky colour, so they blend into it at every hour.
    if (s.lighting.background !== sceneBg) {
      sceneBg = s.lighting.background;
      root.style.setProperty('--scene-bg', sceneBg);
      themeColor?.setAttribute('content', sceneBg);
    }
    if (clock && clockTime) {
      const text = formatClock(s.clockMinutes);
      clockTime.textContent = text.slice(2);
      clock.dataset.phase = root.dataset.phase = text.startsWith('☾') ? 'night' : 'day'; // the rail's sun becomes the moon
    }
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

  const status = document.getElementById('copy-status');
  document.querySelectorAll<HTMLButtonElement>('button[data-copy]').forEach((btn) => {
    if (!navigator.clipboard) return;
    btn.hidden = false;
    let reset = 0;
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(btn.dataset.copy!).then(() => {
        btn.dataset.copied = 'true';
        if (status) status.textContent = 'Email address copied';
        clearTimeout(reset);
        reset = window.setTimeout(() => { delete btn.dataset.copied; if (status) status.textContent = ''; }, 1800);
      }, () => {});
    });
  });

  // Hovering a language (or tapping it, on touch) pulls its book off the shelf in the room.
  const book = (name: string | null) => dispatchEvent(new CustomEvent('portfolio:skill-focus', { detail: { name } }));
  let pulled: string | null = null;
  document.querySelectorAll<HTMLElement>('[data-book]').forEach((el) => {
    el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') book(el.dataset.book!); });
    el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') book(null); });
    el.addEventListener('click', () => { pulled = pulled === el.dataset.book ? null : el.dataset.book!; book(pulled); });
  });

  const focus = (slug: string | null) => dispatchEvent(new CustomEvent('portfolio:project-focus', { detail: { slug } }));
  document.querySelectorAll<HTMLElement>('[data-project]').forEach((el) => {
    const slug = el.dataset.project!;
    el.addEventListener('pointerenter', () => focus(slug));
    el.addEventListener('pointerleave', () => focus(null));
    el.addEventListener('focusin', () => focus(slug));
    el.addEventListener('focusout', () => focus(null));
  });

  // Phones: there's no hover, so the project being read (the one crossing the line just under the room card) goes on
  // the monitor.
  const reading = new IntersectionObserver((entries) => {
    if (!phone.matches) return;
    for (const e of entries) if (e.isIntersecting) focus((e.target as HTMLElement).dataset.project!);
  }, { rootMargin: '-52% 0px -40% 0px' });
  document.querySelectorAll<HTMLElement>('.card[data-project]').forEach((el) => reading.observe(el));
  const projects = document.getElementById('projects');
  if (projects) new IntersectionObserver(([e]) => { if (phone.matches && !e.isIntersecting) focus(null); }).observe(projects);
}
