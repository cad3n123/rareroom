function openNewsletterForm() {
  document.getElementById('shadow').classList.add('active');
  document.getElementById('mc_embed_shell').classList.add('active');
  document.documentElement.style.overflow = 'hidden';
}
function closeNewsletterForm() {
  document.getElementById('shadow').classList.remove('active');
  document.getElementById('mc_embed_shell').classList.remove('active');
  document.documentElement.style.overflow = 'auto';
}

document
  .getElementById('subscribe-button')
  .addEventListener('click', openNewsletterForm);

document
  .getElementById('subscribe-x')
  .addEventListener('click', closeNewsletterForm);
