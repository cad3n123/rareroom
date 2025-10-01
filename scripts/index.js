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
const [homeAudio, aboutAudio, contactAudio, artistsAudio] = [
  'RAREROOM',
  'ABOUT',
  'CONTACT',
  'ARTISTS',
].map((name) => `/audios/${name} MORSE.m4a`);
const bands = ['POLLISH', 'KELSI KEE'];

// Global vars
let localStorageSettings = localStorage.getItem('settings');
let settings;
let flashingInterval = null;
/** @type {AudioBufferSourceNode} */
let currentAudioBufferSource = null;
let $socialMediaIcons = document.createElement('ul');

// Elements
const [
  $backgroundContent,
  $backgroundPicture,
  $homeBackground,
  // $contactBackground,
  // $aboutBackground,
  $content,
  $contactButton,
  $aboutButton,
  $artistsButton,
  $homeLogoMorseContainer,
  $homeLogo,
  $homeLogoShadow,
  $settings,
  $settingsArrowDown,
  $settingsX,
  $settingsBorder,
  $pollishLink,
  $contactEmail,
  $artistsDiv,
  $artistDiv,
  $rareroomTitle,
  $artistImage,
  $artistName,
] = [
  'background-content',
  'background-picture',
  'home-background',
  'content',
  'contact-button',
  'about-button',
  'artists-button',
  'home-logo-morse-container',
  'home-logo',
  'home-logo-shadow',
  'settings',
  'settings-arrow-down',
  'settings-x',
  'settings-border',
  'pollish-link',
  'contact-email',
  'artists-div',
  'artist-div',
  'rareroom-title',
  'artist-image',
  'artist-name',
].map((id) => document.getElementById(id));
const [[$nav, $bandsNav], $$aboutParagraphImgs, $$contacts, [$aboutLink]] = [
  'nav',
  ':scope > img.about',
  ':scope > .contact',
  ':scope > a',
].map((descriptor) => Array.from($content.querySelectorAll(descriptor)));
const [[$main]] = ['main'].map((descriptor) =>
  document.querySelectorAll(descriptor)
);
const [$$navButtons] = [':scope button'].map((descriptor) =>
  $nav.querySelectorAll(descriptor)
);
const [[$settingsContent]] = ['.content'].map((descriptor) =>
  $settings.querySelectorAll(descriptor)
);
const [$$settingsSections] = [':scope > div'].map((descriptor) =>
  $settingsContent.querySelectorAll(descriptor)
);
const [[$backgroundPictureImg]] = ['img'].map((descriptor) =>
  Array.from($backgroundPicture.querySelectorAll(descriptor))
);

function main() {
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
      };
    }
    addButtonClickedEventListener($on, $off);
    addButtonClickedEventListener($off, $on);
  });

  updataContentPosition();
  stateChanged(false);

  if (!settings.previouslyVisited) {
    // $settingsArrowDown.click();
    settings.previouslyVisited = true;
    localStorage.setItem('settings', JSON.stringify(settings));
  }

  addBandButtons();
  preloadArtistImages(bands);
  addContactLinks();

  removeCurtainAfterImagesLoad();
}

/**
 * Preloads the artist background images to prevent jank on hover.
 * @param {string[]} bands - Array of band names.
 */
function preloadArtistImages(bands) {
  bands.forEach((band) => {
    const filename = wordsToFilename(band);
    const img = new Image();
    img.src = `/images/${filename}_artist.jpg`; // This starts the download and caches the image.
  });
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
      $aboutButton,
      [...$$aboutParagraphImgs, $aboutLink].map(($element) => {
        return {
          element: $element,
          displayMode: 'block',
        };
      }),
      []
    );
    if (withMorse) {
      playMorse(aboutAudio, '.- -... --- ..- -');
    }
  } else if (path === '/contact' || path == '/contact/') {
    switchPage(
      $contactButton,
      [
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
      ],
      []
    );
    if (withMorse) {
      playMorse(contactAudio, '-.-. --- -. - .- -.-. -');
    }
  } else if (path.startsWith('/artists') || path.startsWith('/artists/')) {
    if (path === '/artists' || path === '/artists/') {
      switchPage(
        $artistsButton,
        [
          {
            element: $artistsDiv,
            displayMode: 'block',
          },
          {
            element: $rareroomTitle,
            displayMode: 'none',
          },
        ],
        []
      );
      if (withMorse) {
        playMorse(artistsAudio, '.- .-. - .. ... - ...');
      }
    } else {
      let artistName = path.slice('/artists/'.length);
      if (artistName.slice(-1) === '/') {
        artistName = artistName.slice(0, artistName.length - 1);
      }
      switchPage(
        null,
        [
          {
            element: $artistDiv,
            displayMode: 'flex',
          },
          ...[$rareroomTitle, $nav, $homeBackground, $settingsArrowDown].map(
            ($) => {
              return { element: $, displayMode: 'none' };
            }
          ),
        ],
        [
          {
            element: $homeLogoMorseContainer,
            class: 'top',
            isAdding: true,
          },
        ]
      );
      console.log(artistName);
      $artistImage.src = `/images/${artistName}_artist.jpg`;
      $artistName.src = `/images/${artistName}.png`;
    }
  } else {
    switchPage(
      null,
      [
        {
          element: $nav,
          displayMode: 'block',
        },
        {
          element: $rareroomTitle,
          displayMode: 'none',
        },
      ],
      []
    );
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
/**
 * @typedef {Object} SocialMediaLinks
 * @property {String} [youtube]
 * @property {String} [instagram]
 * @property {String} [facebook]
 * @property {String} [twitter]
 * @property {String} [tiktok]
 */
/**
 *
 * @param {SocialMediaLinks} links
 * @returns {HTMLUListElement}
 */
function $socialMediaIconsFactory(links) {
  const $result = document.createElement('ul');
  $result.class = 'social-media-icons';

  const $$links = [
    { url: links['youtube'], img: '/images/youtube.png' },
    { url: links['instagram'], img: '/images/instagram.png' },
    { url: links['facebook'], img: '/images/facebook.png' },
    { url: links['twitter'], img: '/images/x_twitter.png' },
    { url: links['tiktok'], img: '/images/tiktok.png' },
  ]
    .map(
      /**
       * @typedef {Object} Info
       * @property {String} [url]
       * @property {String} img
       */
      /**
       *
       * @param {Info} info
       */
      (info) => {
        if (info.url !== undefined) {
          const $a = document.createElement('a');
          const $img = document.createElement('img');

          $a.href = info.url;
          $img.src = info.img;
          $a.appendChild($img);

          return $a;
        } else {
          return null;
        }
      }
    )
    .filter(($link) => $link != null);

  $$links.forEach(($link) => $result.appendChild($link));

  return $result;
}
function addContactLinks() {
  $socialMediaIcons = $socialMediaIconsFactory({
    youtube: 'https://youtube.com',
    instagram:
      'https://www.instagram.com/rareroomeast/?utm_source=ig_web_button_share_sheet',
    facebook: 'https://facebook.com',
    twitter: 'https://x.com/rareroomeast',
    tiktok: 'https://tiktok.com',
  });
  $socialMediaIcons.style.setProperty('display', 'none');
  $socialMediaIcons.id = 'social-media-icons';
  $socialMediaIcons.classList.add('contact');

  $$contacts.push($socialMediaIcons);

  $content.insertBefore($socialMediaIcons, $contactEmail);
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
$content.addEventListener('scroll', () => {
  if ($content.scrollTop > 5) {
    $homeLogoMorseContainer.classList.add('scrolled');
  } else {
    $homeLogoMorseContainer.classList.remove('scrolled');
  }
});
/**
 * @typedef {Object} ElementSettings
 * @property {HTMLElement} element
 * @property {String} displayMode
 */
/**
 * @typedef {Object} ClassSettings
 * @property {HTMLElement} element
 * @property {String} class
 * @property {boolean} isAdding
 */
/**
 *
 * @param {HTMLButtonElement} selectedNavButton
 * @param {ClassSettings[]} classSettings
 */
function switchPage(selectedNavButton, elementSettings, classSettings) {
  [
    ...$$aboutParagraphImgs,
    $aboutLink,
    ...$$contacts,
    $artistsDiv,
    $artistDiv,
  ].forEach((element) => {
    element.style.display = 'none';
  });
  $homeLogoMorseContainer.classList.remove('top');
  [$rareroomTitle, $homeBackground, $settingsArrowDown].forEach(
    (element) => (element.style.display = 'block')
  );
  $main.classList.remove('inverted');

  elementSettings.forEach((elementSetting) => {
    elementSetting.element.style.display = elementSetting.displayMode;
  });
  classSettings.forEach((classSetting) => {
    if (classSetting.isAdding) {
      classSetting.element.classList.add(classSetting.class);
    } else {
      classSetting.element.classList.remove(classSetting.class);
    }
  });
  $settings.classList.remove('active');
  $settingsArrowDown.classList.add('active');

  $$navButtons.forEach(($navButton) => {
    $navButton.classList.remove('active');
  });
  if (selectedNavButton != null) {
    selectedNavButton.classList.add('active');
  }
}
function addBandButtons() {
  const lastIndex = bands.length - 1;
  bands.forEach((band, i) => {
    const $band = (() => {
      const bandFileName = wordsToFilename(band);
      const artistImageLocation = `/images/${bandFileName}_artist.jpg`;
      const artistNameLocation = `/images/${bandFileName}.png`;

      const $band = document.createElement('button'); // document.createElement('button');

      const $img = document.createElement('img');
      $img.src = artistNameLocation;
      // $span.innerHTML = band + (i == lastIndex ? '' : ',');

      $band.onmouseover = (e) => {
        $backgroundPicture.classList.add('active');

        $backgroundPictureImg.src = artistImageLocation;
        $main.classList.add('inverted');
      };
      $band.onmouseleave = (e) => {
        $backgroundPicture.classList.remove('active');
        $main.classList.remove('inverted');
      };
      $band.onclick = (e) => {
        changeState(`artists/${bandFileName}`);
        $artistImage.src = artistImageLocation;
        $artistName.src = artistNameLocation;
      };

      [$img].forEach(($child) => $band.appendChild($child));

      return $band;
    })();
    $bandsNav.appendChild($band);
    if (i != lastIndex) {
      const $comma = document.createElement('img');
      $comma.src = '/images/comma.png';
      $comma.alt = ',';
      $comma.classList.add('comma');
      $bandsNav.appendChild($comma);
    }
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
  constructor({
    light = false,
    sound = false,
    previouslyVisited = false,
  } = {}) {
    this.light = light;
    this.sound = sound;
    this.previouslyVisited = previouslyVisited;
  }
}
