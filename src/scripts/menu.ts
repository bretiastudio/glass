/**
 * Mobile navigation disclosure.
 * State lives in one attribute (`data-state`) so the CSS transitions can be
 * interrupted and reversed mid-flight by tapping again.
 */
export function initMenu() {
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const menu = document.querySelector<HTMLElement>('[data-menu]');
  const scrim = document.querySelector<HTMLElement>('[data-menu-scrim]');
  if (!toggle || !menu || !scrim) return;

  const desktop = window.matchMedia('(min-width: 900px)');
  const links = Array.from(menu.querySelectorAll<HTMLAnchorElement>('[data-menu-link]'));
  let open = false;

  const set = (next: boolean, { restoreFocus = true } = {}) => {
    if (next === open) return;
    open = next;
    menu.dataset.state = next ? 'open' : 'closed';
    menu.inert = !next;
    toggle.setAttribute('aria-expanded', String(next));
    document.documentElement.classList.toggle('menu-open', next);

    if (next) {
      // Focus after the panel is visible so screen readers announce it in context.
      requestAnimationFrame(() => links[0]?.focus({ preventScroll: true }));
    } else if (restoreFocus && menu.contains(document.activeElement)) {
      toggle.focus({ preventScroll: true });
    }
  };

  toggle.addEventListener('click', () => set(!open));
  scrim.addEventListener('click', () => set(false));

  // Close on selection; the anchor navigation proceeds normally.
  links.forEach((link) => link.addEventListener('click', () => set(false, { restoreFocus: false })));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) {
      e.preventDefault();
      set(false);
    }
  });

  // Keep Tab inside the open panel + toggle (the panel is non-modal but small).
  menu.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !open) return;
    const first = links[0];
    const last = links[links.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      toggle.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      toggle.focus();
    }
  });

  desktop.addEventListener('change', (e) => {
    if (e.matches) set(false, { restoreFocus: false });
  });
}
