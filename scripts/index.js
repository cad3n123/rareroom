// Constant Variables
const canvaBaseWidthPixel = 1366;
const canvaBaseHeightPixel = 768;
const canvaRatioPixel = 1366 / 768;
const canvaBaseWidthPercent = 100;
const canvaBaseHeightPercent = 56.2225;
const canvaScale = 1.1;
const canvaWidthPercent = canvaBaseWidthPercent * canvaScale;
const canvaHeightPercent = canvaBaseHeightPercent * canvaScale;
const flashDelay = 125;
const dot = 120;
const dash = 240;
const letterGap = 120;
const volume = 0.35;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const gainNode = audioCtx.createGain();
gainNode.connect(audioCtx.destination);
gainNode.gain.value = volume;
const [homeAudio, aboutAudio, contactAudio] = [
  'RAREROOM',
  'ABOUT',
  'CONTACT',
].map((name) => `/audios/${name} MORSE.m4a`);
const bands = ['POLLISH', 'KELSI KEE'];

// Global vars
let localStorageSettings = localStorage.getItem('settings');
let settings;
let flashingInterval = null;
/** @type {AudioBufferSourceNode} */
let currentAudioBufferSource = null;

// Elements
const [
  $backgroundContent,
  $backgroundPicture,
  $homeBackground,
  $contactBackground,
  $aboutBackground,
  $content,
  $contactButton,
  $aboutButton,
  $artistsButton,
  $homeLogo,
  $homeLogoShadow,
  $settings,
  $settingsArrowDown,
  $settingsX,
  $socialMediaIcons,
  $settingsBorder,
  $pollishLink,
  $artistsDiv,
] = [
  'background-content',
  'background-picture',
  'home-background',
  'contact-background',
  'about-background',
  'content',
  'contact-button',
  'about-button',
  'artists-button',
  'home-logo',
  'home-logo-shadow',
  'settings',
  'settings-arrow-down',
  'settings-x',
  'social-media-icons',
  'settings-border',
  'pollish-link',
  'artists-div',
].map((id) => document.getElementById(id));
const [[$nav, $bandsNav], $$aboutParagraphImgs, $$contacts, [$aboutLink]] = [
  'nav',
  ':scope > img.about',
  ':scope > .contact',
  ':scope > a',
].map((descriptor) => Array.from($content.querySelectorAll(descriptor)));
const [[$main], $$switch] = ['main', '.switch'].map((descriptor) =>
  document.querySelectorAll(descriptor)
);
const [$$navButtons] = [':scope button'].map((descriptor) =>
  $nav.querySelectorAll(descriptor)
);
const [[$bandsNavSpan]] = ['span'].map((descriptor) =>
  Array.from($bandsNav.querySelectorAll(descriptor))
);
const [[$backgroundPictureImg]] = ['img'].map((descriptor) =>
  Array.from($backgroundPicture.querySelectorAll(descriptor))
);

function main() {
  settings = new Settings(JSON.parse(localStorageSettings ?? '{}'));
  setAudioStatus(settings.sound);
  ['sound', 'light'].forEach((selector) => {
    /** @type {Element} */
    const $switch = [].find.call(
      $$switch,
      /** @param {Element} $switch */ ($switch) => {
        return $switch.matches(`.${selector}`);
      }
    );
    if (settings[selector]) {
      $switch.classList.add('active');
    } else {
      $switch.classList.remove('active');
    }
  });
  $$switch.forEach(($switch) => {
    $switch.addEventListener('click', () => {
      $switch.classList.toggle('active');
      ['sound', 'light'].forEach((descriptor) => {
        if ($switch.classList.contains(descriptor)) {
          settings[descriptor] = !settings[descriptor];
          setAudioStatus(settings.sound);
        }
      });
      localStorage.setItem('settings', JSON.stringify(settings));
      (async () => {
        if (settings.sound) {
          // Fetch and decode the audio file
          const response = await fetch('/audios/switch.wav');
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

          // Create audio source and connect to destination
          const source = audioCtx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(gainNode);

          // Schedule playback a short moment into the future
          source.start(audioCtx.currentTime);
        }
      })();
    });
  });

  updataContentPosition();
  stateChanged(false);

  if (!settings.previouslyVisited) {
    // $settingsArrowDown.click();
    settings.previouslyVisited = true;
    localStorage.setItem('settings', JSON.stringify(settings));
  }

  addBandButtons();

  removeCurtainAfterImagesLoad();
}

/**
 *
 * @param {boolean} isOn
 */
function setAudioStatus(isOn) {
  gainNode.gain.value = isOn ? volume : 0;
}

// Functions
function updataContentPosition() {
  // Settings
  $settings.style.setProperty('--closed-top', `-${$settings.offsetHeight}px`);
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
  $settingsArrowDown.style.setProperty(
    '--margin-top',
    `${$settings.offsetHeight}px`
  );
  $settingsArrowDown.style.setProperty(
    '--margin-left',
    `${$settings.offsetWidth}px`
  );
}
function setBackground(background) {
  [$homeBackground, $contactBackground, $aboutBackground].forEach(
    (background) => {
      background.style.zIndex = '-2';
    }
  );
  if (background != null) {
    background.style.zIndex = '0';
  }
}
/**
 *
 * @param {String} audioUrl - URL of the morse audio file
 * @param {String} morse - Morse string to animate
 */
async function playMorse(audioUrl, morse) {
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }

  $homeLogoShadow.classList.remove('active');
  if (flashingInterval) {
    clearInterval(flashingInterval);
    flashingInterval = null;
  }

  if (currentAudioBufferSource) {
    currentAudioBufferSource.stop();
    currentAudioBufferSource.disconnect();
    currentAudioBufferSource = null;
  }

  // Fetch and decode the audio file
  const response = await fetch(audioUrl);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  // Create audio source and connect to destination
  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(gainNode);

  // Schedule playback a short moment into the future
  const startTime = audioCtx.currentTime + 0.3; // small delay for sync
  source.start(startTime);

  // Schedule the flashing to start in sync
  const delayMs = (startTime - audioCtx.currentTime) * 1000;
  setTimeout(() => {
    $homeLogoShadow.classList.remove('active');
    if (flashingInterval) {
      clearInterval(flashingInterval);
      flashingInterval = null;
    }
    flashMorseCode(morseTiming(morse));
  }, delayMs);

  currentAudioBufferSource = source;
}

async function flashMorseCode(times) {
  let i = 0;
  let j = 0;
  const startDate = Date.now();
  let offset = 0;

  if (settings.light) $homeLogoShadow.classList.add('active');

  flashingInterval = setInterval(() => {
    const currentDate = Date.now();

    while (currentDate - (startDate + offset) > times[i][j]) {
      offset += times[i][j];
      if (j == 0) {
        $homeLogoShadow.classList.remove('active');
      } else if (i + 1 >= times.length) {
        $homeLogoShadow.classList.remove('active');
        clearInterval(flashingInterval);
        flashingInterval = null;
        break;
      } else {
        if (settings.light) $homeLogoShadow.classList.add('active');
        i++;
      }
      j = 1 - j;
    }
  }, 1);
}
function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
/**
 *
 * @param {string} morse
 * @returns {Array[Array[number]]}
 */
function morseTiming(morse) {
  morse += ' ';
  let times = [];
  for (let i = 0; i < morse.length - 1; i++) {
    let char = morse[i];
    let nextChar = morse[i + 1];
    let length1 = char == '.' ? dot / 2 : dash / 2;
    let length2 = length1 + (nextChar == ' ' ? letterGap : 0);
    times.push([length1, length2]);

    if (nextChar == ' ') {
      i++;
    }
  }

  return times;
}
/**
 *
 * @param {HTMLElement} $switch
 */
function createSwitch($switch) {
  const $bar = document.createElement('div');
  $bar.classList.add('bar');
  const $node = document.createElement('div');
  $node.classList.add('node');
  [$bar, $node].forEach(($) => $switch.appendChild($));

  $switch.addEventListener('click', (e) => {
    $switch.classList.toggle('active');
    ['sound', 'light'].forEach((descriptor) => {
      if ($switch.classList.contains(descriptor)) {
        settings[descriptor] = !settings[descriptor];
        setAudioStatus(settings.sound);
      }
    });
    localStorage.setItem('settings', JSON.stringify(settings));
  });
}
/**
 *
 * @param {boolean} withMorse
 */
function stateChanged(withMorse) {
  const path = window.location.pathname;
  if (path === '/about' || path == '/about/') {
    switchPage(
      $homeBackground, // $aboutBackground,
      $aboutButton,
      [...$$aboutParagraphImgs, $aboutLink].map(($element) => {
        return {
          element: $element,
          displayMode: 'block',
        };
      })
    );
    if (withMorse) {
      playMorse(aboutAudio, '.- -... --- ..- -');
    }
  } else if (path === '/contact' || path == '/contact/') {
    switchPage($homeBackground, /*$contactBackground,*/ $contactButton, [
      ...Array.from($$contacts).map(($) => {
        return {
          element: $,
          displayMode: 'block',
        };
      }),
      {
        element: $socialMediaIcons,
        displayMode: 'flex',
      },
    ]);
    if (withMorse) {
      playMorse(contactAudio, '-.-. --- -. - .- -.-. -');
    }
  } else if (path === '/artists' || path == '/artists/') {
    switchPage($homeBackground, /*null,*/ $artistsButton, [
      { element: $artistsDiv, displayMode: 'block' },
    ]);
    if (withMorse) {
      playMorse(contactAudio, '-.-. --- -. - .- -.-. -');
    }
  } else {
    switchPage($homeBackground, null, [
      {
        element: $nav,
        displayMode: 'block',
      },
    ]);
    if (withMorse) {
      playMorse(homeAudio, '.-. .- .-. . .-. --- --- --');
    }
  }
}
/**
 *
 * @param {String} stateName
 */
function changeState(stateName) {
  window.history.pushState({}, '', `/${stateName}`);
  stateChanged(true);
}

// Event Listeners
window.addEventListener('DOMContentLoaded', main);
window.addEventListener('load', updataContentPosition);
window.addEventListener('resize', updataContentPosition);
window.addEventListener('popstate', () => {
  stateChanged(true);
});
$contactButton.addEventListener('click', () => {
  changeState('contact');
});
$aboutButton.addEventListener('click', () => {
  changeState('about');
});
$artistsButton.addEventListener('click', () => {
  changeState('artists');
});
$homeLogo.addEventListener('click', () => {
  changeState('');
});
$settingsArrowDown.addEventListener('click', () => {
  $settings.classList.add('active');
  $settingsArrowDown.classList.remove('active');
});
$settingsX.addEventListener('click', () => {
  $settings.classList.remove('active');
  $settingsArrowDown.classList.add('active');
});
/**
 * @typedef {Object} ElementSettings
 * @property {HTMLElement} element
 * @property {String} displayMode
 */
/**
 *
 * @param {HTMLIFrameElement} background
 * @param {HTMLButtonElement} selectedNavButton
 * @param {ElementSettings[]} elementSettings
 */
function switchPage(background, selectedNavButton, elementSettings) {
  if (background == null || background.style.zIndex != 0) {
    [
      // $nav,
      ...$$aboutParagraphImgs,
      $aboutLink,
      ...$$contacts,
      $artistsDiv,
    ].forEach((element) => {
      element.style.display = 'none';
    });
    elementSettings.forEach((elementSetting) => {
      elementSetting.element.style.display = elementSetting.displayMode;
    });
    $settings.classList.remove('active');
    $settingsArrowDown.classList.add('active');

    $$navButtons.forEach(($navButton) => {
      $navButton.classList.remove('active');
    });
    if (selectedNavButton != null) {
      selectedNavButton.classList.add('active');
    }

    setBackground(background);
  }
}
function addBandButtons() {
  const lastIndex = bands.length - 1;
  bands.forEach((band, i) => {
    $bandsNavSpan.appendChild(
      (() => {
        const $band = document.createElement('button');

        const $span = document.createElement('span');
        $span.innerHTML = band + (i == lastIndex ? '' : ',');

        $band.onmouseover = (e) => {
          console.log('Enter!');
          $backgroundPicture.classList.add('active');
          $backgroundPictureImg.src = `./images/${wordsToFilename(band)}.jpg`;
          $main.classList.add('inverted');
        };
        $band.onmouseleave = (e) => {
          $backgroundPicture.classList.remove('active');
          $main.classList.remove('inverted');
        };

        [$span].forEach(($child) => $band.appendChild($child));

        return $band;
      })()
    );
  });
}
function removeCurtainAfterImagesLoad() {
  const $$images = [...document.querySelectorAll('img')];
  const proms = $$images.map(($image) => {
    if ($image.complete) {
      return Promise.resolve();
    }
    return new Promise((res) => {
      $image.onload = res;
      $image.onerror = res;
    });
  });

  const $curtain = document.getElementById('curtain');

  const finish = (() => {
    let done = false;
    return () => {
      if (done) return;
      done = true;
      $curtain.classList.remove('active');
      const milliseconds = secondsToMilliseconds(
        getComputedStyle($curtain).getPropertyValue('--transition-time').trim()
      );
      setTimeout(() => {
        $curtain.remove();
      }, milliseconds * 1.1);
    };
  })();

  Promise.all(proms).then(finish);
  setTimeout(finish, 10000);
}
function secondsToMilliseconds(timeStr) {
  const match = timeStr.match(/^([\d.]+)s$/);
  if (!match) throw new Error("Invalid time format. Must end in 's'.");
  return Math.round(parseFloat(match[1]) * 1000);
}
/**
 *
 * @param {string} words
 */
function wordsToFilename(words) {
  return words.trim().replace(/\s/g, '-').toLowerCase();
}
// Classes
class Settings {
  constructor({ light = false, sound = true, previouslyVisited = false } = {}) {
    this.light = light;
    this.sound = sound;
    this.previouslyVisited = previouslyVisited;
  }
}
