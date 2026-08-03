/* =============================================================================
   Studio carousel — a full-screen lightbox popup. Built once at boot;
   openLightbox(i) is triggered from any "Studio" control.
   ============================================================================= */
import { $, el } from './dom.js';

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
  const show = (i) => {
    idx = (i + images.length) % images.length;
    img.src = images[idx];
    count.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(images.length).padStart(2, '0')}`;
  };
  const close = () => {
    box.classList.remove('open');
    document.body.style.overflow = '';
  };
  _open = (i = 0) => {
    show(i);
    box.classList.add('open');
    document.body.style.overflow = 'hidden';
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
