/* =============================================================================
   Router — clean-URL (History API) routing, the between-page loading bar,
   nav-morse fitting, and the per-route render + post-render wiring.
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
  socialRowHTML,
} from './views.js';
import { setActiveNav } from './header.js';

function parseRoute() {
  // Clean URLs: /about, /artist/slug, / (home). Fall back to the old #/hash form
  // so any stale bookmark or shared #/link still lands on the right page.
  const hash = location.hash.replace(/^#\/?/, '').replace(/\/+$/, '');
  const path = location.pathname.replace(/^\/+/, '').replace(/\/+$/, '');
  const raw = path || hash;
  const [name, param] = raw.split('/');
  return { name: name || 'home', param: param || '' };
}

/* --------------------------- Per-route SEO metadata ------------------------ */
/* Each route gets a distinct <title>, description, canonical URL and Open Graph/
   Twitter tags so every clean URL indexes as its own real page (and Google can
   use the page-specific titles as sitelink labels), even though it's all one SPA
   shell. Titles read "Page - RAREROOM" (page-specific term first for SEO). */
const SITE_URL = `https://${SITE.domain}`;

function headTag(selector, make) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = make();
    document.head.appendChild(el);
  }
  return el;
}
function metaName(name, content) {
  headTag(`meta[name="${name}"]`, () => {
    const m = document.createElement('meta');
    m.setAttribute('name', name);
    return m;
  }).setAttribute('content', content);
}
function metaProp(prop, content) {
  headTag(`meta[property="${prop}"]`, () => {
    const m = document.createElement('meta');
    m.setAttribute('property', prop);
    return m;
  }).setAttribute('content', content);
}
function setCanonical(url) {
  headTag('link[rel="canonical"]', () => {
    const l = document.createElement('link');
    l.setAttribute('rel', 'canonical');
    return l;
  }).setAttribute('href', url);
}

function applyMeta(pageKey, artist) {
  const brand = SITE.name;
  const url = SITE_URL + (location.pathname === '/' ? '/' : location.pathname);
  // `term` is the page-specific half of the title; `tabTerm` is that half as the
  // TAB shows it, and is only set where the two differ. Home leaves both unset —
  // its tab is the bare brand.
  let term;
  let tabTerm;
  let desc;
  switch (pageKey) {
    case 'about':
      term = 'About';
      desc = `${brand} is a recording studio, record label, and development firm led by producer Logan Gladden — a home for artists and creatives in music and visual arts.`;
      break;
    case 'contact':
      term = 'Contact';
      desc = `Get in touch with ${brand} — demo submissions, booking, press, and general enquiries.`;
      break;
    case 'artist':
      // A name is a proper noun, so it is never shouted — the artist tab reads
      // "Pollish - RAREROOM" while the others read "ABOUT - RAREROOM".
      term = artist.name;
      tabTerm = artist.name;
      desc =
        (artist.bio && artist.bio[0]) ||
        `${artist.name}${artist.role ? ` — ${artist.role}` : ''} on ${brand}.`;
      break;
    case 'privacy':
      term = 'Privacy Policy';
      desc = `How ${brand} collects, uses, and protects your personal information.`;
      break;
    case 'releases':
      term = 'Releases';
      desc = `Records made and released by ${brand} — stream or buy on your platform of choice.`;
      break;
    case 'shop':
      term = 'Shop';
      desc = `Vinyl, apparel, and goods from ${brand}. Limited runs, pressed and printed with care.`;
      break;
    default:
      desc = SITE.intro;
  }
  // Two forms of the same title. The TAB sets the page term in caps and drops
  // the descriptor on home. The SHARE title keeps the sentence-case, descriptive
  // form — a link preview or a card reading "ABOUT - RAREROOM" looks like it is
  // shouting, and og:/twitter: are not what the browser tab renders.
  document.title = term ? `${tabTerm || term.toUpperCase()} - ${brand}` : brand;
  const shareTitle = term
    ? `${term} - ${brand}`
    : `${brand} - Recording Studio & Record Label`;
  metaName('description', desc);
  setCanonical(url);
  metaProp('og:title', shareTitle);
  metaProp('og:description', desc);
  metaProp('og:url', url);
  metaName('twitter:title', shareTitle);
  metaName('twitter:description', desc);
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
/* The backdrop's diagonal wipe. Normally fired the moment the route loader
   finishes, but on the first-visit home page the loader runs UNDERNEATH the
   intro curtain — so the wipe would play out unseen and the backdrop would
   simply be there when the curtain lifted. There it's deferred instead (see
   revealBg below). */
const revealPageBg = (app) => {
  const bg = app.querySelector('.page-bg');
  if (!bg) return;
  bg.classList.add('is-revealed');
  // Retire the wipe once it has played out (see .is-settled in hero.css): a
  // forwards-filled animation keeps the backdrop parked in a composited layer,
  // which Safari rasterises once and then upscales as the scroll-zoom grows it,
  // leaving the artwork visibly soft.
  bg.addEventListener('animationend', () => bg.classList.add('is-settled'), { once: true });
};

function runRouteLoad(app, onDone, revealBg = true) {
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
    // Kick off the backdrop's diagonal reveal now that the page content is
    // visible — unless a curtain is covering it and will do so on its way out.
    if (revealBg) revealPageBg(app);
    // Let the opacity:0 frame paint first, then drop is-loading so #app fades in
    // quickly (a snap-to-visible otherwise).
    requestAnimationFrame(() => {
      app.classList.remove('is-loading');
      onDone?.();
    });
  });
}

/* ------------------------------ Nav mode ---------------------------------- */
/* Which nav the page wears, as a body attribute the stylesheet keys off:
   'island' for the floating puck, 'bar' for the full-width strip. The artist
   page is the only one that takes the bar, and only at desktop widths — on
   phones it wears the island like everything else, so the header never changes
   shape as you move between pages on a phone. Kept in JS rather than as a
   `body:not([data-page='artist'])` + media-query pair in CSS because the switch
   is (page AND width), which would otherwise mean restating every island rule
   inside a phone media query. */
const ISLAND_ONLY = window.matchMedia('(max-width: 760px)');
export function applyNavMode() {
  const bar = document.body.dataset.page === 'artist' && !ISLAND_ONLY.matches;
  document.body.dataset.nav = bar ? 'bar' : 'island';
}
/* Both signals, because they don't always both arrive: the media-query change
   is the precise one, and the resize catches the cases where it doesn't fire
   (some embedded/remote-controlled viewports never dispatch it). applyNavMode
   just re-derives and re-sets the attribute, so running it twice costs nothing
   and setting it to the value it already has is a no-op for the cascade. */
ISLAND_ONLY.addEventListener('change', applyNavMode);
window.addEventListener('resize', applyNavMode, { passive: true });

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
    // Bail BEFORE touching styles when the nav isn't rendered (it's display:none
    // on the island pages). Resetting first and then bailing on a zero
    // measurement used to strand the morse at full natural size, which is what
    // you'd then see after navigating to a page that does show the nav.
    if (!link.getBoundingClientRect().width) return;
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
  let artist = null;

  if (name === 'artist') {
    const a = ARTISTS.find((x) => x.slug === param) || ARTISTS[0];
    artist = a;
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

  state.currentPageKey = pageKey;
  app.innerHTML = html;
  app.classList.add('is-loading'); // stay blank until the loader finishes
  applyMeta(pageKey, artist); // per-route <title> + description + canonical + OG/Twitter
  document.body.dataset.page = pageKey;
  applyNavMode();

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
  // The nav is only laid out on some routes (the artist page shows inline links;
  // island pages hide them), so its morse underlines have to be re-measured
  // whenever the route changes, not just once at startup.
  fitAllNavMorse();
  if (pageKey === 'contact') {
    $('#contact-socials').innerHTML = socialRowHTML(SITE.socials);
  }
  // Hide the social rows now; the staggered pop-in is deferred until AFTER the
  // loader lifts (below) so the animation is always seen, not spent under the
  // loading sweep.
  const socialsRow = pageKey === 'contact'
    ? $('#contact-socials')
    : pageKey === 'artist'
      ? $('.artist__socials', app)
      : null;
  // On phones the artist page skips the staggered social pop-in (it renders them
  // straight away); the contact page keeps the animation everywhere.
  const isMobile = window.matchMedia('(max-width: 760px)').matches;
  const animateSocials = !(pageKey === 'artist' && isMobile);
  if (animateSocials) primeRow(socialsRow);
  if (pageKey === 'home' || pageKey === 'about' || pageKey === 'contact') bindBgGrow(app);
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
    if (animateSocials) revealRow(socialsRow);
    playArrival();
  };

  if (curtain) {
    runRouteLoad(app, null, false); // runs under the curtain
    // The backdrop wipe is the first thing you see AFTER the intro, not
    // something that happened behind it: hold it until the curtain has finished
    // and been torn down, then play it in full.
    curtain.then(() => revealPageBg(app));
    setTimeout(onArrive, 1700); // hold until the curtain has lifted
  } else {
    runRouteLoad(app, onArrive); // fire the moment the loader finishes
  }
}
