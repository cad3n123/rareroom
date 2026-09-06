/* =============================================================================
   Signup popup — a footer-styled panel that rises into the bottom half of the
   screen once the intro is over, carrying the same subscribe form as the footer
   band. Shown once per visit, and not again for three months after that.
   ============================================================================= */
import { el } from './dom.js';
import { newsletterFormHTML, wireNewsletter } from './footer.js';

// localStorage, not session: when it was last shown has to survive the tab
// closing, or "three months" would reset every visit.
const SEEN_KEY = 'rr-signup-popup';
const COOLDOWN = 90 * 24 * 60 * 60 * 1000; // ~3 months

const dueAgain = () => {
  try {
    const last = Number(localStorage.getItem(SEEN_KEY));
    // Never set, or set to something that isn't a number at all.
    if (!last) return true;
    // The old '1' flag, from before this stored timestamps, needs no special case:
    // it parses as 1ms past the epoch, which is long past any cooldown.
    // A clock that has since been set backwards would otherwise lock the popup
    // out for months; treat a future stamp as stale too.
    if (last > Date.now()) return true;
    return Date.now() - last >= COOLDOWN;
  } catch {
    // Private-mode Safari throws on localStorage. Show it; it just can't
    // remember across visits.
    return true;
  }
};
const markSeen = () => {
  try {
    localStorage.setItem(SEEN_KEY, String(Date.now()));
  } catch {
    /* nothing to do — see above */
  }
};

let done = false;
// Set while a panel is on screen, so a route change can dismiss it.
let closeOpen = null;

/* Shuts the panel if one is up. The router calls this on every navigation: the
   popup belongs to the page you landed on, and following a nav link is an answer
   of sorts — you'd rather look at the page than the form. */
export function closeSignupPopup() {
  closeOpen?.();
}

/* Called on every route arrival; opens once per visit and then no-ops. */
export function maybeSignupPopup() {
  if (done) return;
  done = true;
  if (!dueAgain()) return;

  const pop = el('div', 'signup-pop');
  pop.setAttribute('role', 'dialog');
  // Not aria-modal: the page behind stays live and scrollable on purpose. It's a
  // panel you can ignore, not a barrier — and nothing here touches body overflow,
  // so it can't shift the layout the way the lightbox lock has to guard against.
  pop.setAttribute('aria-labelledby', 'signup-pop-title');
  pop.innerHTML = `
    <button type="button" class="signup-pop__close" data-close aria-label="Close"><img src="assets/img/brand/x.png" alt=""></button>
    <h2 class="signup-pop__title" id="signup-pop-title">sign up to receive updates</h2>
    ${newsletterFormHTML()}`;
  document.body.append(pop);

  const close = () => {
    if (!closeOpen) return; // already closing — don't restart the timer
    closeOpen = null;
    markSeen(); // dismissed counts as shown: the three months start here
    pop.classList.remove('open');
    // Outlast the transition, then take it out of the DOM entirely so its form
    // fields leave the tab order.
    setTimeout(() => pop.remove(), 500);
  };
  closeOpen = close;

  // Signing up IS the dismissal — but hold the panel open a beat so the
  // "Thanks — you're on the list." result is actually read before it goes.
  wireNewsletter(pop, () => setTimeout(close, 2200));
  pop.querySelector('[data-close]').addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && pop.isConnected) close();
  });

  /* Flush layout so the panel is measured at its offscreen start position before
     the class flips — otherwise the browser collapses both states into one paint
     and it appears already open, with no slide.

     Deliberately NOT requestAnimationFrame: rAF never fires while the tab is in
     the background, which leaves the panel built but stuck hidden forever. */
  void pop.offsetHeight;
  pop.classList.add('open');
}
