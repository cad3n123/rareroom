/* =============================================================================
   Router — hash routing, the between-page loading bar, nav-morse fitting, and
   the per-route render + post-render wiring.
   ============================================================================= */
import { SITE, ARTISTS, RELEASES, PRODUCTS, featureOn } from './config.js';
import { $, $$, el } from './dom.js';
import { state } from './state.js';
import {
  stopMorse, runMorse, soundOn, flashOn, PAGE_MORSE, fillMorse,
} from './morse.js';
import {
  viewHome, viewAbout, viewContact, viewArtist, viewReleases, viewShop, viewPrivacy,
  releaseCard, productCard, reveal, revealRow, primeRow, maybeIntro, bindBgGrow,
} from './views.js';
import { setActiveNav } from './header.js';

function parseRoute() {
  const raw = location.hash.replace(/^#\/?/, '').replace(/\/$/, '');
  const [name, param] = raw.split('/');
  return { name: name || 'home', param: param || '' };
}

/* --------------------------- Route loader --------------------------------- */
let routeLoader = null;
function ensureLoader() {
  if (routeLoader) return routeLoader;
  routeLoader = el('div', 'route-loader');
  routeLoader.append(el('div', 'route-loader__bar'));
  // Live inside the sticky header so the bar rubber-bands together with the nav
  // on overscroll (a body-level fixed bar would stay put and drift out of line).
  (document.querySelector('.site-header') || document.body).append(routeLoader);
  return routeLoader;
}

/* Blank the content (instantly) and sweep the purple bar (with a slight stutter)
   over the header's divider line until the new view's images have loaded (and a
   minimum time has passed), then reveal — so a page switch feels sleek and never
   flashes half-loaded content. */
function runRouteLoad(app, onDone) {
  const loader = ensureLoader();
  const bar = loader.firstElementChild;
  app.classList.add('is-loading');
  loader.classList.add('active');
  bar.getAnimations?.().forEach((a) => a.cancel());
  // Uneven keyframe offsets give the sweep a realistic stutter.
  const sweep = bar.animate(
    [
      { width: '0%' },
      { width: '28%', offset: 0.2 },
      { width: '33%', offset: 0.34 },
      { width: '66%', offset: 0.6 },
      { width: '72%', offset: 0.72 },
      { width: '92%', offset: 0.9 },
      { width: '100%' },
    ],
    { duration: 620, easing: 'ease-in-out', fill: 'forwards' }
  );

  const imgsReady = Promise.all(
    $$('#app img').map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise((r) => {
          img.addEventListener('load', r, { once: true });
          img.addEventListener('error', r, { once: true });
        })
    )
  );
  const minTime = new Promise((r) => setTimeout(r, 1000));
  const maxTime = new Promise((r) => setTimeout(r, 2200)); // never hang on a slow/broken asset

  Promise.race([Promise.all([imgsReady, minTime]), maxTime]).then(() => {
    sweep.finish();
    loader.classList.remove('active');
    // Kick off the about/contact backdrop's diagonal reveal now that the page
    // content is visible.
    app.querySelector('.page-bg')?.classList.add('is-revealed');
    // Let the opacity:0 frame paint first, then drop is-loading so #app fades in
    // quickly (a snap-to-visible otherwise).
    requestAnimationFrame(() => {
      app.classList.remove('is-loading');
      onDone?.();
    });
  });
}

/* --------------------------- Nav morse fitting ---------------------------- */
/* Fit each nav item's morse strip to the exact width of its word (so the
   "underline" is the length of the word), while keeping a CONSTANT height
   (thickness) regardless of length — only the horizontal scale varies. */
const NAV_MORSE_SY = 0.5; // constant vertical scale → same thickness everywhere
function fitNavMorse(root) {
  if (!root) return;
  $$('.nav__link', root).forEach((link) => {
    const strip = link.querySelector('.nav__morse');
    const m = strip && strip.querySelector('.morse');
    if (!m) return;
    m.style.transform = 'none';
    strip.style.width = 'auto';
    const natural = m.getBoundingClientRect().width;
    const target = link.getBoundingClientRect().width;
    if (!natural || !target) return;
    m.style.transformOrigin = 'left center';
    m.style.transform = `scale(${target / natural}, ${NAV_MORSE_SY})`;
    strip.style.width = `${target}px`;
  });
}
export function fitAllNavMorse() {
  fitNavMorse($('#site-header'));
  fitNavMorse($('#site-footer'));
}

/* --------------------------- Router --------------------------------------- */
export function navigate() {
  const { name, param } = parseRoute();
  const app = $('#app');
  if (!app) return;
  stopMorse();

  let pageKey = name;
  let html;

  if (name === 'artist') {
    const a = ARTISTS.find((x) => x.slug === param) || ARTISTS[0];
    html = viewArtist(a);
  } else if (name === 'about') {
    html = viewAbout();
  } else if (name === 'contact') {
    html = viewContact();
  } else if (name === 'privacy') {
    html = viewPrivacy();
  } else if (name === 'releases' && featureOn('releases')) {
    html = viewReleases();
  } else if (name === 'shop' && featureOn('shop')) {
    html = viewShop();
  } else {
    pageKey = 'home';
    html = viewHome();
  }

  // The artist page skips the loader entirely — it just renders and loads in.
  const useLoader = pageKey !== 'artist';

  state.currentPageKey = pageKey;
  app.innerHTML = html;
  if (useLoader) app.classList.add('is-loading'); // stay blank until the loader finishes
  document.title = 'RAREROOM'; // the tab title is always just "RAREROOM"
  document.body.dataset.page = pageKey;

  // Leaving a page clears any lingering newsletter state in the footer (the inline
  // subscribe result + the typed email) so it never carries across a page switch.
  const news = $('#site-footer .news-form');
  if (news) {
    news.reset();
    const nmsg = news.querySelector('.news-msg');
    if (nmsg) {
      nmsg.textContent = '';
      nmsg.className = 'news-msg';
    }
  }

  // Post-render wiring
  fillMorse(app);
  if (pageKey === 'contact') {
    const host = $('#contact-socials');
    host.innerHTML = SITE.socials
      .map(
        (s, i) =>
          `${i ? '<span class="sep">//</span>' : ''}<a href="${s.url}" target="_blank" rel="noopener">${s.label}</a>`
      )
      .join('');
  }
  // Hide the social rows now; the staggered pop-in is deferred until AFTER the
  // loader lifts (below) so the animation is always seen, not spent under the
  // loading sweep.
  const socialsRow = pageKey === 'contact'
    ? $('#contact-socials')
    : pageKey === 'artist'
      ? $('.artist__socials', app)
      : null;
  primeRow(socialsRow);
  if (pageKey === 'about' || pageKey === 'contact') bindBgGrow(app);
  if (pageKey === 'releases') RELEASES.forEach((r) => $('#releases-grid').append(releaseCard(r)));
  if (pageKey === 'shop') PRODUCTS.forEach((p) => $('#shop-grid').append(productCard(p)));

  reveal();
  setActiveNav(pageKey);
  window.scrollTo(0, 0);

  const curtain = maybeIntro(pageKey);

  // Morse on arrival. Respects the toggles (both default OFF). It fires only once
  // the page has actually loaded in — never during the loading sweep or under the
  // intro curtain — so the flash/sound line up with the page appearing and the
  // sound isn't scheduled over the image-decode work (which crackles on Safari).
  const playArrival = () => {
    const word = PAGE_MORSE[pageKey];
    if (word && (soundOn() || flashOn())) runMorse(word, { sound: soundOn(), flash: flashOn() });
  };
  // Everything that should happen once the page is actually visible: the socials
  // pop-in, then the arrival morse.
  const onArrive = () => {
    revealRow(socialsRow);
    playArrival();
  };

  if (curtain) {
    if (useLoader) runRouteLoad(app); // runs under the curtain
    setTimeout(onArrive, 1700); // hold until the curtain has lifted
  } else if (useLoader) {
    runRouteLoad(app, onArrive); // fire the moment the loader finishes
  } else {
    setTimeout(onArrive, 300); // artist page (no loader)
  }
}
