/* =============================================================================
   View templates (return HTML strings) + the card builders and a couple of
   shared UI helpers (reveal-on-scroll, the intro curtain).
   ============================================================================= */
import { SITE, ARTISTS, socialImg } from './config.js';
import { $$, el } from './dom.js';
import { IC } from './icons.js';
import { morseEl } from './morse.js';

/* --------------------------- Cards ---------------------------------------- */
export function releaseCard(r) {
  const cover = r.cover
    ? `<div class="cover"><img src="${r.cover}" alt="${r.title} cover" loading="lazy"></div>`
    : `<div class="cover cover--stamp"><span class="cover__mark"></span><span class="cover__cat">${r.catalog}</span></div>`;
  const links = Object.entries(r.links || {})
    .map(([k, v]) => `<a href="${v}" target="_blank" rel="noopener">${k}</a>`)
    .join('');
  const card = el('article', 'release reveal');
  card.innerHTML = `
    <div class="cover-wrap" style="position:relative">
      ${cover}
      <div class="cover__play">${links}</div>
    </div>
    <div class="release__meta">
      <div class="release__cat">${r.catalog} · ${r.format}</div>
      <div class="release__title">${r.title}</div>
      <div class="release__sub">${r.artist} — ${r.year}</div>
    </div>`;
  const wrap = card.querySelector('.cover-wrap');
  wrap.querySelector('.cover').append(wrap.querySelector('.cover__play'));
  return card;
}

export function productCard(p) {
  const card = el('article', 'product reveal');
  card.innerHTML = `
    <div class="cover">
      <span class="product__tag">${p.tag}</span>
      <span class="prod-ico">${IC.bag}</span>
    </div>
    <div class="product__row">
      <span class="product__name">${p.name}</span>
      <span class="product__price">${p.price}</span>
    </div>
    <div class="product__variant">${p.variant}</div>
    <a class="btn btn--ghost btn--sm" href="${p.url}" ${p.url && p.url !== '#' ? 'target="_blank" rel="noopener"' : ''
    }>View ${IC.arrow}</a>`;
  return card;
}

/* --------------------------- Social rows ----------------------------------- */
/* One link in a social row. The label is set as the original site's stamped
   wordmark where there is art for it (see SOCIAL_IMG) and falls back to the text
   otherwise, so a platform added to config still renders. The alt text carries
   the label either way, so the row reads the same to a screen reader as it
   always did. */
export function socialLinkHTML(label, url) {
  const img = socialImg(label);
  const inner = img
    ? `<img class="social-img" src="${img}" alt="${label}">`
    : label;
  return `<a href="${url}" target="_blank" rel="noopener">${inner}</a>`;
}

/* The whole row, built identically everywhere it appears — the footer, the nav
   panel and the contact page were each carrying their own copy of this. */
export function socialRowHTML(items) {
  return items
    .map((s, i) => `${i ? '<span class="sep">//</span>' : ''}${socialLinkHTML(s.label, s.url)}`)
    .join('');
}

export function artistSocialsHTML(a) {
  const order = ['site', 'youtube', 'instagram', 'facebook', 'x', 'tiktok'];
  // "Site", not "Website" — the stamped art reads SITE (as it did on the old
  // site), and the label is what the alt text says.
  const labels = {
    site: 'Site',
    youtube: 'YouTube',
    instagram: 'Instagram',
    facebook: 'Facebook',
    x: 'X',
    tiktok: 'TikTok',
  };
  return socialRowHTML(
    order.filter((k) => a.links && a.links[k]).map((k) => ({ label: labels[k], url: a.links[k] }))
  );
}

/* --------------------------- View templates ------------------------------- */
/* The hero uses its OWN copy of the stamp, cut to 476px — exactly twice the
   238px the lockup ever reaches (see .hero__stamp's clamp), so on a 2x display
   it maps one image pixel to one device pixel and is resampled not at all.
   Handing the full 1967px master to a 238px box means a ~4x downscale, which
   drops Chrome onto a mipmap level and comes out visibly soft — that's why the
   logo sharpened up when the window was zoomed to 110% and the factor changed.
   The nav and footer keep the master; they're small enough not to show it.
   If the lockup is ever resized past 238px, regenerate this at 2x the new max. */
const heroLogo = () =>
  `<a class="hero__logo" href="/" aria-label="RAREROOM — home"><img class="hero__stamp js-flash" src="assets/img/brand/stamp-hero.png" alt="RAREROOM" width="476" height="242"></a>`;
const heroMorse = () =>
  `<div class="hero__morse"><img class="hero__morse-half" src="assets/img/brand/rare-morse.png" alt=""><img class="hero__morse-half" src="assets/img/brand/room-morse.png" alt=""></div>`;
const scrollCue = () =>
  `<img class="scroll-cue" src="assets/img/brand/down-arrow.png" alt="" aria-hidden="true">`;
/* Full-bleed typewriter-text backdrop (from the old site) that sits behind the
   about/contact lockup and scrolls up with the page. Rendered as a direct child
   of #app (a sibling of the section) so it can break out of the .wrap width. */
const BG_SRC = 'assets/img/brand/home_transparent.png';
/* `split` renders the backdrop twice. Both copies are the same file — the two
   "halves" are made with object-position in CSS rather than by cropping two
   assets, so there's one image to swap if the artwork ever changes and no
   second download. On phones they become side-by-side columns showing two
   different slices; at desktop widths the second copy is hidden and it behaves
   as the single full-bleed image. */
const pageBg = (split = false) =>
  `<div class="page-bg${split ? ' page-bg--split' : ''}" aria-hidden="true"><img src="${BG_SRC}" alt="">${
    split ? `<img src="${BG_SRC}" alt="">` : ''
  }</div>`;

export function viewHome() {
  return `
  ${pageBg(true)}
  <section class="hero wrap">
    <div class="hero__inner">
      ${heroLogo()}
      ${heroMorse()}
    </div>
    ${scrollCue()}
  </section>`;
}

export function viewAbout() {
  return `
  ${pageBg()}
  <section class="hero wrap editorial about-hero-min">
    <img class="page-index" src="assets/img/brand/about-nav.png" alt="About" aria-hidden="true">
    <div class="hero__inner">
      <div class="editorial__mast">
        ${heroLogo()}
        ${heroMorse()}
        <img class="wordmark" src="assets/img/brand/rareroom-title.png" alt="RAREROOM">
      </div>
      <span class="hero-rule" aria-hidden="true"></span>
      <p class="about-copy typed">RAREROOM exists to make and release music. It&rsquo;s a recording studio and artist-first independent label aiming to bring songs out of sessions to the people who need to hear them.</p>
      <p class="about-copy typed">Started by musician and producer <a class="about-link" href="https://www.pollishtheproject.com/" target="_blank" rel="noopener">Logan Gladden</a> - and distributed worldwide through <a class="about-link" href="https://www.theorchard.com/" target="_blank" rel="noopener">The Orchard</a> - RAREROOM helps to create, release, and grow work, offering everything a traditional label can offer, but on fair terms.</p>
      <p class="about-copy typed">It can provide a space, support, and creative freedom for independent artists - as it should be.</p>
    </div>
  </section>`;
}

export function viewContact() {
  return `
  ${pageBg()}
  <section class="hero wrap editorial about-hero-min">
    <img class="page-index" src="assets/img/brand/contact-nav.png" alt="Contact" aria-hidden="true">
    <div class="hero__inner">
      <div class="editorial__mast">
        ${heroLogo()}
        ${heroMorse()}
        <img class="wordmark" src="assets/img/brand/rareroom-title.png" alt="RAREROOM">
      </div>
      <span class="hero-rule" aria-hidden="true"></span>
      <a class="contact-email" href="mailto:${SITE.email.demos}" aria-label="Email ${SITE.email.demos}">
        <img class="contact-email__bracket" src="assets/img/brand/left-bracket.png" alt="[">
        <img class="contact-email__addr" src="assets/img/brand/email-demos.png" alt="${SITE.email.demos}">
        <img class="contact-email__bracket" src="assets/img/brand/right-bracket.png" alt="]">
      </a>
      <div class="social-row contact-socials" id="contact-socials"></div>
    </div>
  </section>`;
}

export function viewArtist(a) {
  const nameInner = a.nameImg
    ? `<img class="artist-detail__name" src="${a.nameImg}" alt="${a.name}">`
    : `<h1 class="artist-detail__name-text">${a.name}</h1>`;
  // Both the name AND the portrait link out to the artist's own site (when they
  // have one), with the same lift-on-hover / press feedback.
  const site = a.links && a.links.site;
  const name = site
    ? `<a class="artist-detail__name-link" href="${site}" target="_blank" rel="noopener" aria-label="${a.name} — website">${nameInner}</a>`
    : nameInner;
  const photoInner = `<img src="${a.photo}" alt="${a.name}">`;
  const photo = site
    ? `<a class="artist-detail__photo-link" href="${site}" target="_blank" rel="noopener" aria-label="${a.name} — website">${photoInner}</a>`
    : photoInner;
  return `
  <section class="artist-detail">
    <img class="page-index" src="assets/img/brand/artists-nav.png" alt="Artists" aria-hidden="true">
    <div class="artist-detail__inner">
      <figure class="artist-detail__photo">
        ${photo}
      </figure>
      <div class="artist-detail__meta">
        ${name}
        <span class="hero-rule" aria-hidden="true"></span>
        <div class="social-row artist__socials">${artistSocialsHTML(a)}</div>
      </div>
    </div>
  </section>`;
}

export function viewReleases() {
  return `
  <section class="section section--tight"><div class="wrap">
    <span class="eyebrow">Discography</span>
    <h1 class="h-display" style="margin-top:.6rem">Releases</h1>
    <p class="lead" style="max-width:52ch;margin-top:1rem">Records made and released by RAREROOM. Stream or buy on your platform of choice.</p>
  </div></section>
  <section class="section" style="padding-top:0"><div class="wrap">
    <div class="placeholder-note"><span data-morse="RR"></span><span><b>Placeholder catalogue.</b>&nbsp; Sample entries so you can see the layout. Replace them in <code>assets/js/config.js</code> → <code>RELEASES</code>, or hide with <code>FEATURES.releases = false</code>.</span></div>
    <div class="grid grid--releases" id="releases-grid"></div>
  </div></section>`;
}

export function viewShop() {
  return `
  <section class="section section--tight"><div class="wrap">
    <span class="eyebrow">Store</span>
    <h1 class="h-display" style="margin-top:.6rem">Shop</h1>
    <p class="lead" style="max-width:52ch;margin-top:1rem">Vinyl, apparel, and goods from the room. Limited runs, pressed and printed with care.</p>
  </div></section>
  <section class="section" style="padding-top:0"><div class="wrap">
    <div class="placeholder-note"><span data-morse="RR"></span><span><b>Placeholder products.</b>&nbsp; Sample items to preview the layout. Replace them in <code>assets/js/config.js</code> → <code>PRODUCTS</code>, or hide with <code>FEATURES.shop = false</code>.</span></div>
    <div class="grid grid--shop" id="shop-grid"></div>
  </div></section>`;
}

export function viewPrivacy() {
  const s = (h, b) => `<section><h2 class="serif">${h}</h2>${b}</section>`;
  return `
  <section class="section section--tight"><div class="wrap">
    <h1 class="h-1" style="margin-top:.6rem">Privacy Policy</h1>
  </div></section>
  <section class="section" style="padding-top:0"><div class="wrap policy">
    ${s('Information We Collect', `<p>We may collect the following categories of information:</p>
      <ul class="policy-list">
        <li><strong>Voluntarily Provided Information.</strong> When you sign up for our newsletter or other communications, we may collect personal information such as your name and email address.</li>
        <li><strong>Automatically Collected Information.</strong> At present, our websites do not utilize cookies, analytics tools, or similar technologies. However, we reserve the right to implement such technologies in the future.</li>
      </ul>`)}
    ${s('How We Use Information', '<p>We may use the information we collect for the following purposes: To provide newsletters, updates, and promotional communications. To maintain and improve our websites, services, and offerings. To comply with legal obligations and enforce our rights. For other purposes disclosed to you at the time of collection or with your consent.</p>')}
    ${s('Third-Party Services', '<p>We currently use Mailchimp to manage our newsletter communications. When you provide your email address and other personal information for this purpose, that information may be stored, processed, and managed by Mailchimp in accordance with its own privacy practices.</p><p>In the future, we may integrate additional third-party services, including but not limited to analytics providers, advertising platforms, or content distribution partners. Such services may collect or process information about your use of our websites, including through cookies or similar technologies. We will update this Policy accordingly to reflect any such integrations.</p>')}
    ${s('Cookies and Tracking Technologies', '<p>At this time, our websites do not employ cookies or tracking technologies. If and when we adopt such technologies (for example, to enable analytics or targeted advertising), this Policy will be updated to describe the types of cookies used, their purposes, and the choices available to you.</p>')}
    ${s('Data Retention', '<p>We retain your personal information only for as long as is reasonably necessary to fulfill the purposes described in this Policy, unless a longer retention period is required or permitted by law.</p>')}
    ${s('Your Rights and Choices', '<p>You may unsubscribe from our newsletter at any time by following the “unsubscribe” link provided in our email communications. You may also request that we delete or update your personal information by contacting us at the address provided below.</p>')}
    ${s('Data Security', '<p>We implement commercially reasonable technical and organizational measures to protect your personal information against unauthorized access, use, or disclosure. However, no method of transmission or storage is completely secure, and we cannot guarantee absolute security.</p>')}
    ${s('International Users', '<p>Our websites are accessible worldwide. If you are accessing our websites from outside the United States, please note that your information may be transferred to, stored, and processed in jurisdictions where privacy laws may not be as protective as those in your location.</p>')}
    ${s('Changes to This Policy', '<p>We reserve the right to modify this Policy at any time. Any changes will be effective upon posting the updated Policy on our websites, unless otherwise required by law. Your continued use of our websites following the posting of changes constitutes your acceptance of those changes.</p>')}
    ${s('Contact Us', `<p>If you have any questions about this Policy or our data practices, please contact us at:</p><a class="link-u" href="mailto:${SITE.email.ops}">${SITE.email.ops}</a>`)}
  </div></section>`;
}

/* Scroll-driven backdrop growth (about/contact). On phones the typewriter-text
   image already creeps larger as you scroll (a side effect of the mobile URL bar
   resizing the dvh-sized backdrop — a "bug" we ended up liking). This reproduces
   the same slow, slight scale-up on desktop by tying the image's scale to how far
   the page has scrolled. Self-cleans once the backdrop leaves the DOM. */
export function bindBgGrow(app) {
  const bg = app.querySelector('.page-bg');
  if (!bg) return;
  // Plural: the home backdrop is two side-by-side copies on phones, and both
  // columns have to grow together.
  const imgs = [...bg.querySelectorAll('img')];
  if (!imgs.length) return;
  let raf = 0;
  const apply = () => {
    raf = 0;
    if (!bg.isConnected) {
      window.removeEventListener('scroll', onScroll);
      return;
    }
    const y = window.scrollY || 0;
    // Phones lean harder into it — reaching +90% twice as fast as desktop's
    // +44%. They used to be left to the dvh URL-bar creep alone, which is far
    // too slight to read as a zoom (and doesn't happen at all in browsers that
    // don't resize the viewport on scroll).
    const phone = window.innerWidth <= 760;
    const s = 1 + Math.min(phone ? 0.9 : 0.44, y / (phone ? 800 : 1600));
    if (phone) {
      // Two half-width columns, each growing about its own centre — a transform
      // is the only thing that does that without the pair fighting over the
      // layout. At rest clear it rather than writing scale(1): an identity
      // transform still promotes the backdrop into a composited layer.
      bg.style.removeProperty('--bg-grow');
      imgs.forEach((img) => (img.style.transform = s === 1 ? '' : `scale(${s})`));
      return;
    }
    // Desktop: hand the factor to CSS, which grows the image's BOX (see
    // hero.css) so it is re-rasterised at the size it is drawn — a transform
    // here left Safari upscaling one stale raster and the backdrop went soft.
    imgs.forEach((img) => (img.style.transform = ''));
    bg.style.setProperty('--bg-grow', String(s));
  };
  const onScroll = () => {
    if (!raf) raf = requestAnimationFrame(apply);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  apply();
}

/* --------------------------- Reveal on scroll ----------------------------- */
export function reveal() {
  const items = $$('.reveal');
  if (!items.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );
  items.forEach((i) => io.observe(i));
}

/* Hide a social row immediately (opacity:0) so it can't flash visible before the
   staggered reveal runs — call at render time, ahead of the loader. */
export function primeRow(row) {
  if (!row) return;
  [...row.children].forEach((it) => it.classList.add('reveal-item'));
}

/* Socials fade in one-by-one, left → right (as the old site did). */
export function revealRow(row) {
  if (!row) return;
  const items = [...row.children];
  items.forEach((it) => it.classList.add('reveal-item'));
  requestAnimationFrame(() =>
    items.forEach((it, i) => setTimeout(() => it.classList.add('in'), 120 + i * 90))
  );
}

/* --------------------------- Intro curtain -------------------------------- */
let introShown = false;
export function maybeIntro(pageKey) {
  if (introShown) return false;
  introShown = true;
  if (pageKey !== 'home' || sessionStorage.getItem('rr-entered')) return false;
  sessionStorage.setItem('rr-entered', '1');

  // An exact replica of the home hero lockup (same classes → same size + position)
  // so that when the curtain fades, the real hero sits in precisely the same spot
  // and the transition is seamless. (No js-flash / link — purely the resting look.)
  const c = el('div', 'curtain');
  c.innerHTML = `
    <section class="hero">
      <div class="hero__inner">
        <span class="hero__logo"><img class="hero__stamp" src="assets/img/brand/stamp-hero.png" alt="RAREROOM" width="476" height="242"></span>
        ${heroMorse()}
      </div>
    </section>`;
  document.body.append(c);
  document.body.style.overflow = 'hidden';
  // Resolves when the curtain is not just fading but gone, so callers can hold
  // their own entrances until the intro is genuinely over. Truthy either way, so
  // `if (curtain)` still reads as "did the intro run?".
  return new Promise((resolve) => {
    let ending = false;
    const done = () => {
      if (ending) return;
      ending = true;
      c.classList.add('gone');
      document.body.style.overflow = '';
      setTimeout(() => {
        c.remove();
        resolve();
      }, 800);
    };
    setTimeout(done, 1500);
    c.addEventListener('click', done);
  });
}
