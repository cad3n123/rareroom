/* =============================================================================
   Studio carousel — a full-screen lightbox popup. Built once at boot;
   openLightbox(i) is triggered from any "Studio" control.
   ============================================================================= */
import { $, el, lockScroll } from './dom.js';

let _open = () => {};
export const openLightbox = (i = 0) => _open(i);

export function buildLightbox(images) {
  const box = el('div', 'lightbox');
  box.innerHTML = `
    <button class="lightbox__btn lightbox__close" aria-label="Close"><img class="lightbox__x" src="assets/img/brand/x.png" alt="Close"></button>
    <button class="lightbox__btn lightbox__prev" aria-label="Previous"><img class="lightbox__arrow" src="assets/img/brand/back-arrow.png" alt=""></button>
    <img class="lightbox__img" alt="">
    <button class="lightbox__btn lightbox__next" aria-label="Next"><img class="lightbox__arrow" src="assets/img/brand/forward-arrow.png" alt=""></button>
    <div class="lightbox__count"></div>`;
  document.body.append(box);
  const img = $('.lightbox__img', box);
  const count = $('.lightbox__count', box);
  let idx = 0;
  // Bumped on every show() so a slow decode that finishes after you've already
  // arrowed past it can't reveal the wrong photo.
  let token = 0;
  const show = (i) => {
    idx = (i + images.length) % images.length;
    const mine = ++token;
    /* An <img> with no loaded file has NO width. Dropping the src in and showing
       it immediately means the photo snaps from nothing to full size the instant
       it arrives — the "jerk" on any cold cache (a hard reload, incognito, a
       first visit). So hold the photo invisible, sized and centred, until it has
       actually decoded, then fade it in. The overlay itself still opens at once,
       so the click never feels unanswered. */
    img.classList.remove('is-ready');
    img.src = images[idx];
    const ready = () => {
      if (mine === token) img.classList.add('is-ready');
    };
    // decode() resolves only once the pixels are ready to paint; it rejects if the
    // src is swapped mid-flight, which the token check already covers.
    img.decode().then(ready, ready);
    // Arrowing on to a neighbour should be instant, so fetch them in the background.
    [idx + 1, idx - 1].forEach((n) => {
      new Image().src = images[(n + images.length) % images.length];
    });
    count.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(images.length).padStart(2, '0')}`;
  };
  const close = () => {
    box.classList.remove('open');
    lockScroll(false);
  };
  _open = (i = 0) => {
    show(i);
    box.classList.add('open');
    lockScroll(true);
  };
  $('.lightbox__close', box).addEventListener('click', close);
  $('.lightbox__prev', box).addEventListener('click', () => show(idx - 1));
  $('.lightbox__next', box).addEventListener('click', () => show(idx + 1));
  box.addEventListener('click', (e) => {
    if (e.target === box) close();
  });
  document.addEventListener('keydown', (e) => {
    if (!box.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });
}
