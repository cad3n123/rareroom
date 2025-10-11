import { $main } from './index.js';
import { setAudioStatus } from './audio.js';

// Elements
const [$settings, $settingsArrowDown, $settingsX, $settingsBorder] = [
  'settings',
  'settings-arrow-down',
  'settings-x',
  'settings-border',
].map((id) => document.getElementById(id));
const [[$settingsContent]] = ['.content'].map((descriptor) =>
  $settings.querySelectorAll(descriptor)
);
const [$$settingsSections] = [':scope > div'].map((descriptor) =>
  $settingsContent.querySelectorAll(descriptor)
);

// Global vars
/** @type {Settings} */
let settings;
let aspectRatio = 1.0;

// Functions
function main() {
  let localStorageSettings = localStorage.getItem('settings');
  settings = new Settings(JSON.parse(localStorageSettings ?? '{}'));
  setAudioStatus(settings.sound);

  $$settingsSections.forEach(($settingsSection) => {
    const [$$buttons] = ['button'].map((descriptor) =>
      $settingsSection.querySelectorAll(descriptor)
    );
    if ($$buttons.length < 2) {
      return;
    }
    const [$on, $off] = $$buttons;

    ['sound', 'light'].forEach((descriptor) => {
      if ($settingsSection.classList.contains(descriptor)) {
        if (settings[descriptor]) {
          $on.classList.add('active');
          $off.classList.remove('active');
        } else {
          $on.classList.remove('active');
          $off.classList.add('active');
        }
      }
    });

    /**
     *
     * @param {HTMLButtonElement} $target
     * @param {HTMLButtonElement} $other
     */
    function addButtonClickedEventListener($target, $other) {
      $target.onclick = (e) => {
        $target.classList.add('active');
        $other.classList.remove('active');

        ['sound', 'light'].forEach((descriptor) => {
          if ($settingsSection.classList.contains(descriptor)) {
            settings[descriptor] = $target === $on;
            setAudioStatus(settings.sound);
          }
        });

        localStorage.setItem('settings', JSON.stringify(settings));
      };
    }
    addButtonClickedEventListener($on, $off);
    addButtonClickedEventListener($off, $on);
  });

  if (!settings.previouslyVisited) {
    settings.previouslyVisited = true;
    localStorage.setItem('settings', JSON.stringify(settings));
  }
  if ($main.classList.contains('first-inverted')) {
    $settingsArrowDown.classList.add('up-away');
  }

  updateContentPosition();
}
function updateContentPosition() {
  const closedTopOffset = 2;
  $settings.style.setProperty(
    '--closed-top',
    `-${$settings.offsetHeight + closedTopOffset}px`
  );
  $settings.style.setProperty('--closed-left', `-${$settings.offsetWidth}px`);

  $settingsBorder.style.setProperty(
    '--top',
    `${($settings.offsetHeight - $settingsBorder.offsetHeight) / 2}px`
  );
  $settingsBorder.style.setProperty(
    '--left',
    `${($settings.offsetWidth - $settingsBorder.offsetWidth) / 2}px`
  );

  $settingsArrowDown.style.setProperty(
    '--left',
    `${($settings.offsetWidth - $settingsArrowDown.offsetWidth) / 2}px`
  );
  $settingsArrowDown.style.setProperty(
    '--top',
    `${($settings.offsetHeight - $settingsArrowDown.offsetHeight) / 2}px`
  );
  const settingArrowOffsetTop = -3;
  $settingsArrowDown.style.setProperty(
    '--margin-top',
    `${$settings.offsetHeight + settingArrowOffsetTop}px`
  );
  $settingsArrowDown.style.setProperty(
    '--margin-left',
    `${$settings.offsetWidth}px`
  );
}
function closeSettings() {
  $settings.classList.remove('active');
  $settingsArrowDown.classList.add('active');
}
/**
 *
 * @param {UIEvent | Event} event
 */
function onWindowLoadedOrResized(event) {
  updateContentPosition();
  const width = window.innerWidth;
  const height = window.innerHeight;
  const newAspectRatio = width / height;

  if (
    (aspectRatio > 1.0 && newAspectRatio <= 1.0) ||
    (aspectRatio <= 1.0 && newAspectRatio > 1.0)
  ) {
    closeSettings();
  }
  aspectRatio = newAspectRatio;
}

// Event Listeners
window.addEventListener('load', onWindowLoadedOrResized);
window.addEventListener('resize', onWindowLoadedOrResized);
$settingsX.addEventListener('click', closeSettings);
$settingsArrowDown.addEventListener('click', () => {
  $settings.classList.add('active');
  $settingsArrowDown.classList.remove('active');
});

// Classes
class Settings {
  constructor({ light = true, sound = false, previouslyVisited = false } = {}) {
    this.light = light;
    this.sound = sound;
    this.previouslyVisited = previouslyVisited;
  }
}

export { $settings, $settingsArrowDown, settings, main, closeSettings };
