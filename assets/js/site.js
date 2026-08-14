/* =============================================================================
   RARE ROOM — single-page app (hash-routed) entry point.

   Everything lives on one document so the AudioContext (and morse state) stays
   alive across "page" switches. The app is split into focused modules:
     config.js   — content + settings (the one file to edit for content)
     dom.js      — query/create helpers
     state.js    — shared mutable state (current page key)
     icons.js    — inline SVG icons
     morse.js    — morse table, rendering, and the sound/flash engine
     views.js    — per-route HTML templates + cards + reveal + intro curtain
     header.js   — the sticky nav (built once)
     footer.js   — the footer (built once)
     lightbox.js — the studio carousel popup
     router.js   — hash routing, loading bar, nav-morse fitting
   This file just wires them together at boot.
   ============================================================================= */
import { STUDIO, hydrateFromRemote } from './config.js';
import { buildHeader } from './header.js';
import { buildFooter } from './footer.js';
import { buildLightbox, openLightbox } from './lightbox.js';
import { state } from './state.js';
import {
  primeAudioOnGesture, ensureAudio, runMorse, soundOn, flashOn, PAGE_MORSE,
} from './morse.js';
import { navigate, fitAllNavMorse } from './router.js';

/* How long the footer's "Artists" control waits before unrolling the roster
   inside the nav panel — long enough for the panel's own expand to be well
   underway, so the two motions read one after the other. */
const ARTISTS_DROP_DELAY = 500;

async function boot() {
  // First visit: make sure both morse channels start OFF (only sets the default
  // when there's no stored preference — returning visitors keep their choice).
  ['rr-sound', 'rr-flash'].forEach((k) => {
    if (localStorage.getItem(k) == null) localStorage.setItem(k, 'off');
  });
  // Fold the live S3 roster (images + social links) into the config before we
  // build anything, so the footer/header/artist pages render with it.
  await hydrateFromRemote();
  buildHeader();
  buildFooter();
  buildLightbox(STUDIO.images);
  primeAudioOnGesture();
  fitAllNavMorse();

  document.addEventListener('click', (e) => {
    // Clean-URL routing: intercept clicks on internal links (href starting with
    // "/") and drive the SPA via History.pushState instead of a full page load.
    // External links (mailto:, http…, target=_blank), downloads and
    // modifier/middle clicks are left alone for the browser to handle normally.
    const link = e.target.closest('a[href^="/"]');
    if (
      link &&
      link.target !== '_blank' &&
      !link.hasAttribute('download') &&
      e.button === 0 &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.shiftKey &&
      !e.altKey
    ) {
      const href = link.getAttribute('href');
      e.preventDefault();
      if (href !== location.pathname) {
        history.pushState({}, '', href);
        navigate();
      }
      // Same route → don't re-render; fall through so the hero logo (an <a href="/">
      // on the home page) can still replay its flash below.
    }
    // Open the studio carousel from any "Studio" control (header, footer, mobile).
    const trigger = e.target.closest('[data-action="studio"]');
    if (trigger) {
      e.preventDefault();
      openLightbox(0);
      return;
    }
    // Every "Artists" control that isn't in the nav itself — the footer link and
    // the artist page's vertical title — mirrors whatever nav the page is wearing.
    // Keyed on the nav MODE, not the viewport width: everywhere but the artist
    // page at desktop widths the header is the floating island, whose inline
    // link list (and so its hover dropdown) doesn't exist — the artists live in
    // the island's panel. So the island branch opens that panel and expands the
    // Artists accordion inside it; only the artist page's full-width bar still
    // has a top-nav dropdown to pin open.
    const artistsMenu = e.target.closest('[data-artists-menu]');
    if (artistsMenu) {
      e.preventDefault();
      if (document.body.dataset.nav === 'island') {
        const menu = document.querySelector('#mobileMenu');
        const menuToggle = document.querySelector('[data-menu-toggle]');
        if (menu && !menu.classList.contains('open')) menuToggle?.click();
        // The artists list is held back so the two motions read in sequence —
        // the nav expands, THEN the roster unrolls inside it — instead of both
        // running at once and landing as one confusing jump. If the accordion is
        // already open it closes first and re-opens after the same beat, so the
        // control always reads as "here are the artists" rather than doing
        // nothing (or silently collapsing the list you asked for).
        const drop = document.querySelector('#mobileMenu [data-mobile-drop]');
        if (drop) {
          if (drop.closest('.mobile-drop')?.classList.contains('open')) drop.click();
          setTimeout(() => {
            if (!drop.closest('.mobile-drop')?.classList.contains('open')) drop.click();
          }, ARTISTS_DROP_DELAY);
        }
      } else {
        // Force the top-nav dropdown open (the sticky header keeps it in view), then
        // let the next outside click / pointer-leave dismiss it.
        const item = document.querySelector('#site-header .nav__item--dropdown');
        if (item) {
          item.classList.remove('is-dismissed');
          item.classList.add('is-pinned');
          const unpin = () => {
            item.classList.remove('is-pinned');
            document.removeEventListener('click', onDocClick, true);
          };
          const onDocClick = (ev) => {
            if (!item.contains(ev.target)) unpin();
          };
          item.addEventListener('mouseleave', unpin, { once: true });
          setTimeout(() => document.addEventListener('click', onDocClick, true), 0);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }
    // The About page's vertical title reloads the page rather than soft-navigating
    // — it's already the route you're on, so the SPA router would render nothing.
    const pageReload = e.target.closest('[data-page-reload]');
    if (pageReload) {
      e.preventDefault();
      const route = `/${pageReload.dataset.pageReload}`;
      location.pathname === route ? location.reload() : location.assign(route);
      return;
    }
    // The big hero logo always replays the home flash — even when you're already
    // on the home page (where the hash wouldn't change to re-trigger it).
    const logo = e.target.closest('.hero__logo');
    if (logo) {
      // Momentary "press-in" (works the same on desktop + touch, never sticks).
      logo.classList.add('is-pressed');
      setTimeout(() => logo.classList.remove('is-pressed'), 650);
    }
    if (logo && state.currentPageKey === 'home') {
      e.preventDefault();
      ensureAudio();
      // Respect the toggles — if flash (and sound) are off, clicking the logo does
      // nothing rather than always flashing.
      if (soundOn() || flashOn()) {
        runMorse(PAGE_MORSE.home, { sound: soundOn(), flash: flashOn(), gesture: true });
      }
    }
  });

  let fitTimer;
  window.addEventListener('resize', () => {
    clearTimeout(fitTimer);
    fitTimer = setTimeout(fitAllNavMorse, 150);
  });
  window.addEventListener('load', fitAllNavMorse); // re-fit once web fonts settle

  // Back/forward buttons (and any pushState from the click handler above).
  window.addEventListener('popstate', navigate);
  navigate();
}

document.addEventListener('DOMContentLoaded', boot);
