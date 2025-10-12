// Constant Variables
const [
  $subscribeButton,
  $subscribeX,
  $emailInput,
  $emailPlaceholderImage,
  $countrySelect,
  $countryPlaceholder,
] = [
  'subscribe-button',
  'subscribe-x',
  'mce-EMAIL',
  'email-placeholder',
  'mce-COUNTRY',
  'country-placeholder',
].map((id) => document.getElementById(id));

// Functions
function main() {
  setCountryList();
}
function openNewsletterForm() {
  document.getElementById('shadow').classList.add('active');
  document.getElementById('mc_embed_shell').classList.add('active');
  document.documentElement.style.overflow = 'hidden';
}
function closeNewsletterForm() {
  document.getElementById('shadow').classList.remove('active');
  document.getElementById('mc_embed_shell').classList.remove('active');
}
function setCountryList() {
  fetch('https://restcountries.com/v3.1/all?fields=name')
    .then((res) => res.json())
    .then((data) => {
      const select = document.querySelector("select[name='COUNTRY']");
      data
        .sort((a, b) => a.name.common.localeCompare(b.name.common))
        .forEach((country) => {
          const opt = document.createElement('option');
          opt.value = country.name.common;
          opt.textContent = country.name.common;
          select.appendChild(opt);
        });
    });
}

// Event Listeners
$subscribeButton.addEventListener('click', openNewsletterForm);
$subscribeX.addEventListener('click', closeNewsletterForm);
$emailInput.addEventListener('input', () => {
  if ($emailInput.value.trim() === '') {
    $emailPlaceholderImage.style.display = 'block';
  } else {
    $emailPlaceholderImage.style.display = 'none';
  }
});
$countrySelect.addEventListener('change', () => {
  if ($countrySelect.value === '') {
    $countryPlaceholder.style.display = 'block';
  } else {
    $countryPlaceholder.style.display = 'none';
  }
});

export { main, closeNewsletterForm };
