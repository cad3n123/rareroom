/* =============================================================================
   DOM helpers — tiny query/create utilities used across the app.
   No dependencies (safe to import anywhere).
   ============================================================================= */
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};

/* Freeze/unfreeze page scrolling behind an overlay (lightbox, intro curtain).

   Locking scroll hides the scrollbar, and where the scrollbar takes real space
   that WIDENS the page by its ~10-15px — everything centred jumps sideways as
   the overlay opens and jumps back on close. `scrollbar-gutter: stable` on <html>
   (base.css) usually absorbs it by keeping the gutter reserved, but how much it
   absorbs varies by browser and by the OS "show scroll bars" setting, so don't
   trust it blindly: measure the actual width before and after and pad out
   whatever moved. Zero on overlay scrollbars, where nothing moved to begin with.

   Note this does drop body's `overflow-x: clip` to `hidden` for as long as the
   lock is held — CSS downgrades `clip` whenever the other axis is `hidden`, so
   setting `overflow-y` alone doesn't dodge it. That's the state base.css warns
   about for iOS rubber-band scrolling, but it only lasts while a full-screen
   overlay is up and there's nothing to rubber-band anyway. */
export function lockScroll(on) {
  const { body } = document;
  if (!on) {
    body.style.overflow = '';
    body.style.paddingRight = '';
    return;
  }
  // Measured before any padding is applied, so the compensation can't double up.
  const width = () => body.getBoundingClientRect().width;
  const before = width();
  body.style.overflow = 'hidden';
  const grew = width() - before;
  if (grew > 0) body.style.paddingRight = `${grew}px`;
}
