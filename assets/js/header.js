/* =============================================================================
   Header — the sticky nav (logo, links with morse underlines, Subscribe, the
   flash/sound toggles, and the mobile menu). Built once at boot.
   ============================================================================= */
import { NAV, SITE, ARTISTS, featureOn } from './config.js';
import { $, $$ } from './dom.js';
import { IC } from './icons.js';
import { navMorseHTML, muteChannel, unmuteChannel } from './morse.js';
import { socialRowHTML } from './views.js';

export function navLinks() {
  return NAV.filter((n) => featureOn(n.feature));
}
function dropdownItems(kind) {
  if (kind === 'artists')
    return ARTISTS
      // list the roster alphabetically by name (copy first — don't reorder the
      // source ARTISTS, which other things rely on in config order)
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((a) => ({ label: a.name, href: `/artist/${a.slug}` }));
  return [];
}

export function buildHeader() {
  const host = $('#site-header');
  if (!host) return;
  const links = navLinks()
    .map((n) => {
      if (n.dropdown) {
        const subs = dropdownItems(n.dropdown)
          .map((s) => `<a href="${s.href}">${s.label}</a>`)
          .join('');
        return `<div class="nav__item nav__item--dropdown">
          <button type="button" class="nav__link nav__link--parent" aria-haspopup="true">${n.label} ${IC.chevDown}${navMorseHTML(n.label)}</button>
          <div class="nav__dropdown"><div class="nav__dropdown-panel">${subs}</div></div>
        </div>`;
      }
      if (n.action === 'studio')
        return `<button type="button" class="nav__link nav__link--parent" data-action="studio">${n.label}${navMorseHTML(n.label)}</button>`;
      return `<a class="nav__link" href="/${n.route}" data-route="${n.route}">${n.label}${navMorseHTML(n.label)}</a>`;
    })
    .join('');
  // "Subscribe" scrolls down to the newsletter block in the footer instead of
  // navigating away. It reads as the stamped SUBSCRIBE serif label in a black
  // chip (the same black-box / inverted-ink treatment as the vertical titles).
  const subscribeBtn = `<button type="button" class="nav__subscribe" data-signup aria-label="Subscribe"><img class="nav__subscribe-img" src="assets/img/brand/subscribe.png" alt="Subscribe"></button>`;

  const mobileLinks = navLinks()
    .map((n) => {
      // Artists (and any dropdown) is a collapsible accordion — same idea as the
      // desktop hover dropdown, tap to expand.
      if (n.dropdown)
        return `<div class="mobile-drop">
          <button type="button" class="mobile-menu__link mobile-drop__toggle" data-mobile-drop aria-expanded="false">${n.label} ${IC.chevDown}</button>
          <div class="mobile-drop__panel"><div class="mobile-drop__inner">
            ${dropdownItems(n.dropdown)
              .map((s) => `<a class="mobile-drop__item" href="${s.href}">${s.label}</a>`)
              .join('')}
          </div></div>
        </div>`;
      if (n.action === 'studio')
        return `<button type="button" class="mobile-menu__link" data-action="studio">${n.label}</button>`;
      return `<a class="mobile-menu__link" href="/${n.route}">${n.label}</a>`;
    })
    .join('');
  // Socials pinned to the bottom of the open menu.
  const mobileSocials = socialRowHTML(SITE.socials);

  host.innerHTML = `
  <header class="site-header">
    <div class="wrap">
      <span class="island-tag">a room that is rare</span>
      <button class="icon-btn nav-toggle" data-menu-toggle aria-label="Menu" aria-expanded="false">
        <span class="nav-toggle__ico nav-toggle__arrow"><img src="assets/img/brand/down-arrow.png" alt=""></span>
        <span class="nav-toggle__ico nav-toggle__x"><img src="assets/img/brand/x.png" alt=""></span>
      </button>
      <a class="brand" href="/" aria-label="RAREROOM home">
        <img class="brand__mark js-flash" src="assets/img/brand/stamp.png" alt="RAREROOM" width="80" height="40">
      </a>
      <nav class="nav" aria-label="Primary">${links}${subscribeBtn}</nav>
      <div class="header-tools">
        <button class="icon-btn icon-btn--flash" data-flash aria-pressed="false" title="Toggle morse flashing" aria-label="Toggle morse flashing">
          <span class="i-off">${IC.flashOff}</span><span class="i-on">${IC.flashOn}</span>
        </button>
        <button class="icon-btn icon-btn--sound" data-sound aria-pressed="false" title="Toggle morse sound" aria-label="Toggle morse sound">
          <span class="i-off">${IC.soundOff}</span><span class="i-on">${IC.soundOn}</span>
        </button>
      </div>
    </div>
    <div class="mobile-menu" id="mobileMenu">
      <div class="mobile-menu__clip">
        <div class="mobile-menu__body">
          <nav class="mobile-menu__nav" aria-label="Mobile">
            ${mobileLinks}
            <button type="button" class="nav__subscribe mobile-menu__subscribe" data-signup aria-label="Subscribe"><img class="nav__subscribe-img" src="assets/img/brand/subscribe.png" alt="Subscribe"></button>
          </nav>
          <div class="mobile-menu__socials social-row">${mobileSocials}</div>
        </div>
      </div>
    </div>
  </header>`;

  // The hamburger toggles the menu and crossfades into an X (the header itself
  // stays put — the menu opens below it).
  const menu = $('#mobileMenu');
  const toggle = $('[data-menu-toggle]');
  // Scroll is only locked on phones, where the menu covers the screen. On desktop
  // it's a small panel hanging off the island, so freezing the page behind it
  // just feels broken.
  const phone = window.matchMedia('(max-width: 760px)');
  const setMenu = (open) => {
    menu.classList.toggle('open', open);
    toggle.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open && phone.matches ? 'hidden' : '';
  };
  toggle?.addEventListener('click', () => setMenu(!menu.classList.contains('open')));

  // The whole island is a toggle: clicking any dead space on the slab opens or
  // closes the panel, so you don't have to hit the small chevron. Anything that
  // is already a control (the chevron itself, the logo link, the flash/sound
  // buttons) keeps its own behaviour — the closest() guard lets those clicks
  // through untouched.
  //
  // Keyed on the nav MODE, not the page. Only the full-width bar is excluded,
  // because it carries inline nav links and has no panel hanging off it — and
  // the artist page is the only page that wears it, and only at desktop widths.
  // On a phone that page takes the island like every other, so it gets the
  // tap-anywhere behaviour too; checking data-page here used to exclude it at
  // every width and left its island the one slab you couldn't tap open.
  host.querySelector('.site-header .wrap')?.addEventListener('click', (e) => {
    if (document.body.dataset.nav === 'bar') return;
    if (e.target.closest('a, button')) return;
    setMenu(!menu.classList.contains('open'));
  });

  // Artists accordion: tap to expand, without closing the whole menu.
  $$('#mobileMenu [data-mobile-drop]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const drop = btn.closest('.mobile-drop');
      const open = drop.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    })
  );
  // Any real navigation (link or non-accordion button) closes the menu.
  $$('#mobileMenu a, #mobileMenu button:not([data-mobile-drop])').forEach((a) =>
    a.addEventListener('click', () => setMenu(false))
  );

  // "Sign Up" (nav + mobile menu) smooth-scrolls to the footer newsletter block
  // and focuses the email field, instead of leaving the site.
  $$('[data-signup]').forEach((b) =>
    b.addEventListener('click', () => {
      const cta = $('#signup');
      if (!cta) return;
      cta.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => cta.querySelector('input')?.focus({ preventScroll: true }), 500);
    })
  );

  // Picking an artist from the dropdown hides it again (until you hover away
  // and back), instead of leaving the panel stuck open under the cursor.
  $$('#site-header .nav__dropdown-panel a').forEach((a) =>
    a.addEventListener('click', () => {
      a.closest('.nav__item--dropdown')?.classList.add('is-dismissed');
      document.activeElement?.blur?.();
    })
  );
  $$('#site-header .nav__item--dropdown').forEach((item) =>
    item.addEventListener('mouseleave', () => item.classList.remove('is-dismissed'))
  );

  // Two morse switches. Turning a channel OFF stops only that channel; turning
  // ON syncs it to any run already in flight (or starts a fresh preview).
  const wireToggle = (btn, key, channel) => {
    const reflect = () => {
      const on = localStorage.getItem(key) === 'on';
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', String(on));
    };
    reflect();
    btn.addEventListener('click', () => {
      const turningOn = localStorage.getItem(key) !== 'on';
      localStorage.setItem(key, turningOn ? 'on' : 'off');
      reflect();
      turningOn ? unmuteChannel(channel) : muteChannel(channel);
    });
  };
  wireToggle($('[data-flash]'), 'rr-flash', 'flash');
  wireToggle($('[data-sound]'), 'rr-sound', 'sound');
}

export function setActiveNav(pageKey) {
  $$('#site-header .nav [data-route]').forEach((a) =>
    a.dataset.route === pageKey
      ? a.setAttribute('aria-current', 'page')
      : a.removeAttribute('aria-current')
  );
  const parent = $('#site-header .nav__link--parent[aria-haspopup]');
  if (parent)
    pageKey === 'artist'
      ? parent.setAttribute('aria-current', 'page')
      : parent.removeAttribute('aria-current');
}
