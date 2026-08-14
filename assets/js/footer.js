/* =============================================================================
   Footer — full-width white subscribe band + the black footer body (brand,
   footer nav with morse underlines, socials, decorative morse strip). Built
   once at boot.
   ============================================================================= */
import { SITE } from './config.js';
import { $ } from './dom.js';
import { navMorseHTML } from './morse.js';
import { navLinks } from './header.js';
import { socialRowHTML } from './views.js';

export function buildFooter() {
  const host = $('#site-footer');
  if (!host) return;
  const socials = socialRowHTML(SITE.socials);
  const footNav = navLinks()
    // Keep a single "Artists" control (opens the top-nav dropdown on desktop / the
    // hamburger menu with Artists expanded on mobile — wired in site.js); keep the
    // plain routes as links.
    .flatMap((n) => {
      // data-route marks which item to light up as the current page — the same
      // brighter ink + morse underline the header nav gets (see setActiveNav).
      if (n.dropdown === 'artists')
        return [
          `<button type="button" class="nav__link nav__link--parent" data-artists-menu data-route="artist">${n.label}${navMorseHTML(n.label)}</button>`,
        ];
      if (n.route)
        return [`<a class="nav__link" href="/${n.route}" data-route="${n.route}">${n.label}${navMorseHTML(n.label)}</a>`];
      return [];
    })
    .concat([
      // Studio is an overlay, not a route, so it never reads as "current".
      `<button type="button" class="nav__link nav__link--parent" data-action="studio">Studio${navMorseHTML('Studio')}</button>`,
      `<a class="nav__link" href="/privacy" data-route="privacy">Privacy${navMorseHTML('Privacy')}</a>`,
    ])
    .join('');

  host.innerHTML = `
  <footer class="site-footer">
    <div class="footer-cta" id="signup">
      <div class="wrap">
        <form class="news-form" novalidate>
          <div class="field">
            <input class="input" type="email" name="EMAIL" required autocomplete="email" placeholder="Email address" aria-label="Email address">
          </div>
          <div style="position:absolute;left:-9999px" aria-hidden="true">
            <input type="text" name="${SITE.mailchimp.botField}" tabindex="-1" value="" autocomplete="off">
          </div>
          <button class="nav__subscribe news-submit" type="submit" aria-label="Subscribe"><img class="nav__subscribe-img" src="assets/img/brand/subscribe.png" alt="Subscribe"></button>
          <p class="news-consent">By subscribing you agree to receive emails from RAREROOM. See our <a href="/privacy">Privacy Policy</a>.</p>
          <p class="news-msg" role="status" aria-live="polite"></p>
        </form>
      </div>
    </div>
    <div class="wrap footer-main">
      <div class="footer-bottom">
        <div class="footer-brand">
          <a href="/" aria-label="RAREROOM home"><img src="assets/img/brand/stamp.png" alt="RAREROOM"></a>
          <span class="mono">© ${new Date().getFullYear()} RAREROOM<br><a href="https://${SITE.domain}" target="_blank" rel="noopener">${SITE.domain}</a><br>distributed by <a class="footer-orchard" href="https://www.theorchard.com/" target="_blank" rel="noopener">The Orchard</a></span>
        </div>
        <nav class="footer-nav" aria-label="Footer">${footNav}</nav>
        <div class="social-row">${socials}</div>
      </div>
      <div class="footer-morse">
        <span class="line"></span>
        <span class="footer-morse__img"><img src="assets/img/brand/rare-morse.png" alt=""><img src="assets/img/brand/room-morse.png" alt=""></span>
        <span class="line"></span>
      </div>
    </div>
  </footer>`;

  wireNewsletter(host);
}

/* Subscribe without leaving the site. The old flow POSTed to Mailchimp's hosted
   page (target=_blank), which then dead-ends on a broken "Continue to website"
   signup that demands first/last name. Instead we hit Mailchimp's JSONP endpoint
   (/subscribe/post-json) and show our own inline result. */
function wireNewsletter(host) {
  const form = host.querySelector('.news-form');
  if (!form) return;
  const input = form.querySelector('input[name="EMAIL"]');
  const msg = form.querySelector('.news-msg');
  const setMsg = (text, kind) => {
    msg.textContent = text;
    msg.className = `news-msg${kind ? ` is-${kind}` : ''}`;
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = input.value.trim();
    if (!email || !input.checkValidity()) {
      input.focus();
      setMsg('Please enter a valid email.', 'err');
      return;
    }
    setMsg('Signing up…', '');

    const cb = `mcCb${Math.random().toString(36).slice(2)}`;
    const src =
      SITE.mailchimp.action.replace('/post?', '/post-json?') +
      `&EMAIL=${encodeURIComponent(email)}` +
      `&${encodeURIComponent(SITE.mailchimp.botField)}=` + // honeypot, left empty
      `&c=${cb}`;
    const script = document.createElement('script');
    const cleanup = () => {
      delete window[cb];
      script.remove();
    };
    const timer = setTimeout(() => {
      cleanup();
      setMsg('Something went wrong — please try again.', 'err');
    }, 8000);

    window[cb] = (res) => {
      clearTimeout(timer);
      cleanup();
      const raw = (res && res.msg ? String(res.msg) : '').replace(/<[^>]*>/g, '').trim();
      // Check the message text BEFORE the result flag: Mailchimp reports an
      // already-subscribed address in the `msg` but has been seen to return it with
      // result:'success' too, which made every resubmit read as a fresh "thanks".
      if (/already subscribed/i.test(raw)) {
        setMsg('You’re already subscribed.', 'ok');
      } else if (res && res.result === 'success') {
        setMsg('Thanks — you’re on the list.', 'ok');
        form.reset();
      } else {
        setMsg(raw || 'Please enter a valid email.', 'err');
      }
    };
    script.onerror = () => {
      clearTimeout(timer);
      cleanup();
      setMsg('Something went wrong — please try again.', 'err');
    };
    script.src = src;
    document.body.appendChild(script);
  });
}
