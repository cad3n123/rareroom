import {
  $settingsArrowDown,
  settings,
  main as settingsMain,
  closeSettings,
  switchPageDefaults as settingsSwitchPageDefaults,
} from '/scripts/settings.js';
import { audioCtx, gainNode, main as audioMain } from '/scripts/audio.js';
import {
  main as subscribeMain,
  $subscribeButton,
  $shadow,
  $mcEmbedShell,
} from '/scripts/subscribe.js';

// Constant Variables
const numStudioImages = 9;
const dot = 120;
const dash = 240;
const letterGap = 120;
const [homeAudio, aboutAudio, contactAudio, artistsAudio, subscribeAudio] = [
  'RAREROOM',
  'ABOUT',
  'CONTACT',
  'ARTISTS',
  'SUBSCRIBE',
].map((name) => `/audios/${name} MORSE.m4a`);
const bands = ['KELSI KEE', 'POLLISH'];
const mobilePurplePulseMS = 750;

// Global vars
let flashingInterval = null;
/** @type {AudioBufferSourceNode} */
let currentAudioBufferSource = null;
let $socialMediaIcons = document.createElement('ul');
let artistData = [];
let socialLinks = {};
let previouslyWasZoomedOut = true;

// Elements
const [
  $backgroundContent,
  $backgroundPicture,
  $homeBackground,
  $content,
  $contactButton,
  $aboutButton,
  $artistsButton,
  $homeLogoMorseContainer,
  $homeLogo,
  $homeLogoShadow,
  $studioButton,
  $privacyPolicyButton,
  $aboutContainer,
  $artistsDiv,
  $artistDiv,
  $studioDiv,
  $privacyPolicyDiv,
  $studioX,
  $privacyPolicyX,
  $rareroomTitle,
  $artistImages,
  $artistName,
  $artistNameLink,
  $artistSocials,
  $clickHereMessage,
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
  'studio-button',
  'privacy-policy-button',
  'about-container',
  'artists-div',
  'artist-div',
  'studio-div',
  'privacy-policy-div',
  'studio-x',
  'privacy-policy-x',
  'rareroom-title',
  'artist-images',
  'artist-name',
  'artist-name-link',
  'artist-socials',
  'click-here-message',
].map((id) => document.getElementById(id));
const [[$nav, $bandsNav], $$aboutParagraphImgs, $$contacts] = [
  'nav',
  ':scope > img.about',
  ':scope > .contact',
].map((descriptor) => Array.from($content.querySelectorAll(descriptor)));
const [
  [$main],
  $$imgHoverPurple0_5,
  $$imgHoverPurple,
  $$imgHoverPurple1_5,
  $$imgHoverPurpler,
  $$imgHover3Purple,
] = [
  'main',
  '.img-hover-purple-0-5',
  '.img-hover-purple',
  '.img-hover-purple-1-5',
  '.img-hover-purpler',
  '.img-hover-3-purple',
].map((descriptor) => document.querySelectorAll(descriptor));
const $$imageHoverPurples = [
  ...$$imgHoverPurple0_5,
  ...$$imgHoverPurple,
  ...$$imgHoverPurple1_5,
  ...$$imgHoverPurpler,
  ...$$imgHover3Purple,
];
const [$$navButtons] = [':scope button'].map((descriptor) =>
  $nav.querySelectorAll(descriptor)
);
const [[$studioBack], [$studioTrack], [$studioForward]] = [
  '.back',
  '.carousel-track',
  '.forward',
].map((descriptor) => $studioDiv.querySelectorAll(descriptor));

async function main() {
  audioMain();
  settingsMain();
  subscribeMain();

  await updateArtistData();
  preloadArtistImages();
  addContactLinks();

  addBandButtons();
  populateStudioImages();

  stateChanged(false);
  removeCurtainAfterImagesLoad();
}

function populateStudioImages() {
  let currentIndex = 0;

  // Populate carousel dynamically
  for (let i = 1; i <= numStudioImages; i++) {
    const img = document.createElement('img');
    img.src = `/images/studio/RRE${i}.jpg`;
    img.alt = `Image ${i}`;
    $studioTrack.appendChild(img);
  }

  // Function to update slide position
  function updateCarousel() {
    $studioTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
  }
  // Button events
  $studioForward.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % numStudioImages;
    updateCarousel();
  });

  $studioBack.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + numStudioImages) % numStudioImages;
    updateCarousel();
  });
}

/**
 * Preloads the artist background images to prevent jank on hover.
 */
function preloadArtistImages() {
  artistData.forEach((artist) => {
    /**
     * @param {string} src
     * @param {string} name
     */
    const createImage = (src, name) => {
      const $wrapper = document.createElement('div');
      $wrapper.classList.add('image-wrapper');
      $wrapper.classList.add(name);

      const $img = new Image();
      $img.addEventListener('load', () => {
        $wrapper.classList.add('loaded');
      });
      $img.src = src;
      $wrapper.style.setProperty('--bg-image', `url(${src})`);

      $wrapper.appendChild($img);
      return $wrapper;
    };

    $backgroundPicture.appendChild(createImage(artist.image, artist.name));
    $artistImages.appendChild(createImage(artist.image, artist.name));
  });
}

// Functions
async function updateArtistData() {
  const S3_URL =
    'https://rareroom-bucket.s3.us-east-2.amazonaws.com/rareroom/data.json';

  try {
    const response = await fetch(S3_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    artistData = data.artists;
    socialLinks = data['social-links'];
  } catch (err) {
    console.error('Failed to fetch artist data:', err);
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
 * @param {boolean} withMorse
 */
function stateChanged(withMorse) {
  const path = window.location.pathname;
  if (!['', '/'].includes(path)) {
    $backgroundContent.style.setProperty('--opacity-transition', '0ms');
    $main.classList.remove('first-inverted');
    setTimeout(() => {
      $backgroundContent.style.setProperty('--opacity-transition', '250ms');
    }, 1);
  }
  if (path === '/about' || path == '/about/') {
    switchPage(
      $aboutButton,
      [...$$aboutParagraphImgs, $aboutContainer, $nav].map(($element) => {
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
        ...[...Array.from($$contacts), $nav].map(($) => {
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
  } else if (path === '/subscribe' || path == '/subscribe/') {
    switchPage(
      $subscribeButton,
      [],
      [
        ...[$shadow, $mcEmbedShell].map(($) => {
          return { element: $, class: 'active', isAdding: true };
        }),
        { element: document.documentElement, class: 'active', isAdding: false },
      ]
    );
    if (withMorse) {
      playMorse(subscribeAudio, '... ..- -... ... -.-. .-. .. -... .');
    }
  } else if (path.startsWith('/artists') || path.startsWith('/artists/')) {
    if (path === '/artists' || path === '/artists/') {
      switchPage(
        $artistsButton,
        [
          ...[$nav, $artistsDiv].map(($) => {
            return {
              element: $,
              displayMode: 'block',
            };
          }),
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
          ...[$rareroomTitle, $nav, $homeBackground].map(($) => {
            return { element: $, displayMode: 'none' };
          }),
        ],
        [
          {
            element: $homeLogoMorseContainer,
            class: 'top',
            isAdding: true,
          },
          {
            element: $settingsArrowDown,
            class: 'up-away',
            isAdding: true,
          },
          {
            element: $backgroundPicture,
            class: 'active',
            isAdding: false,
          },
          {
            element: $main,
            class: 'inverted',
            isAdding: false,
          },
        ],
        artistName
      );
      while ($artistSocials.firstChild) {
        $artistSocials.removeChild($artistSocials.firstChild);
      }
      let artistNameLocation = `/images/${artistName}.png`;
      $artistName.src = artistNameLocation;

      const thisArtistData = getArtist(artistName);
      if (thisArtistData !== undefined) {
        const purpleClass =
          thisArtistData['class'] === undefined
            ? 'img-hover-purple'
            : thisArtistData['class'];

        const artistSite = thisArtistData['site'];
        $artistName.className = '';
        if (artistSite !== undefined) {
          $artistNameLink.href = artistSite;
          $artistName.classList.add(purpleClass);
        }

        const artistImgSource = thisArtistData['image'];
        if (artistImgSource !== undefined) {
          for (const $artistImage of $artistImages.children) {
            $artistImage.classList.remove('active');

            if ($artistImage.classList.contains(artistName)) {
              $artistImage.classList.add('active');
            }
          }
        }
      }
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
  if (stateName !== '') {
    removeFirstInverted();
  }
  stateChanged(true);
}
/**
 *
 * @param {HTMLAnchorElement} $a
 */
function linkNewTab($a) {
  $a.target = '_blank';
  $a.rel = 'noopener noreferrer';
}
/**
 * @typedef {Object} SocialMediaLinks
 * @property {String} [site]
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
  $result.classList.add('social-media-icons');

  const $$links = [
    { url: links['site'], img: '/images/site.png' },
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
          linkNewTab($a);
          $img.src = info.img;

          $a.classList.add('img-hover-purple');

          $a.appendChild($img);

          return $a;
        } else {
          return null;
        }
      }
    )
    .filter(($link) => $link != null);

  const $$doubleSlashes = Array.from({ length: $$links.length - 1 }, () => {
    const $doubleSlash = document.createElement('img');
    $doubleSlash.src = '/images/double_slash.png';
    $doubleSlash.alt = '//';
    return $doubleSlash;
  });

  const startingDelta = 50;
  const delayDelta = 50;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const $ = entry.target;
        if (entry.isIntersecting) {
          let index = $$links.indexOf($);
          if (index === -1) {
            index = $$doubleSlashes.indexOf($) + 0.5;
          }

          const delay = startingDelta + index * 2 * delayDelta;

          setTimeout(() => {
            $.classList.add('seen');
          }, delay);
        } else {
          $.classList.remove('seen');
        }
      });
    },
    { threshold: 0.1 }
  ); // threshold = 10% visible

  const lastIndex = $$links.length - 1;
  $$links.forEach(($link, i) => {
    observer.observe($link);
    $result.appendChild($link);
    if (i < lastIndex) {
      const $doubleSlash = $$doubleSlashes[i];
      observer.observe($doubleSlash);
      $result.appendChild($doubleSlash);
    }
  });

  return $result;
}
function addContactLinks() {
  $socialMediaIcons = $socialMediaIconsFactory(socialLinks);
  $socialMediaIcons.style.setProperty('display', 'none');
  $socialMediaIcons.id = 'social-media-icons';
  $socialMediaIcons.classList.add('contact');

  $$contacts.push($socialMediaIcons);

  $content.insertBefore($socialMediaIcons, $artistDiv);
}
function removeFirstInverted() {
  $main.classList.remove('first-inverted');
  setTimeout(() => {
    $backgroundContent.style.setProperty('--opacity-transition', '250ms');
  }, 1000);
}
function removeIntro() {
  removeFirstInverted();
  changeState('');
}

// Event Listeners
window.addEventListener('DOMContentLoaded', main);
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
$homeLogo.addEventListener('click', removeIntro);
$clickHereMessage.addEventListener('click', removeIntro);
$content.addEventListener('scroll', () => {
  if ($content.scrollTop > 5) {
    $homeLogoMorseContainer.classList.add('scrolled');
  } else {
    $homeLogoMorseContainer.classList.remove('scrolled');
  }
});
$studioButton.addEventListener('click', () => {
  $studioDiv.classList.add('active');
});
$studioX.addEventListener('click', () => {
  $studioDiv.classList.remove('active');
});
$privacyPolicyButton.addEventListener('click', () => {
  $privacyPolicyDiv.classList.add('active');
});
$privacyPolicyX.addEventListener('click', () => {
  $privacyPolicyDiv.classList.remove('active');
});
$$imageHoverPurples.forEach(($imageHoverPurple) => {
  $imageHoverPurple.addEventListener('click', () => {
    $imageHoverPurple.classList.remove('flash');
    void $imageHoverPurple.offsetWidth; // force reflow (resets animation)
    $imageHoverPurple.classList.add('flash');
    setTimeout(
      () => $imageHoverPurple.classList.remove('flash'),
      mobilePurplePulseMS
    ); // match animation duration
  });
});
if (window.visualViewport) {
  // Add an event listener for when the viewport resizes (zooms)
  window.visualViewport.addEventListener('resize', () => {
    // Check if the user is fully zoomed out (scale = 1)
    if (window.visualViewport.scale === 1) {
      if (!previouslyWasZoomedOut) {
        const iterations = 6;
        const deltaT = 25;
        let i = 0;
        // A tiny delay ensures the browser has finished its zoom logic
        const interval = setInterval(() => {
          // Force the scroll position back to the top-left corner
          window.scrollTo(0, 0);
          if (i >= iterations) {
            clearInterval(interval);
          }
          i++;
        }, deltaT);
      }
      previouslyWasZoomedOut = true;
    } else {
      previouslyWasZoomedOut = false;
    }
  });
}
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
 * @param {ElementSettings} elementSettings
 * @param {ClassSettings[]} classSettings
 * @param {string} [artistName]
 */
function switchPage(
  selectedNavButton,
  elementSettings,
  classSettings,
  artistName
) {
  settingsSwitchPageDefaults();
  [
    ...$$aboutParagraphImgs,
    $aboutContainer,
    ...$$contacts,
    $artistsDiv,
    $artistDiv,
  ].forEach((element) => {
    element.style.display = 'none';
  });
  $homeLogoMorseContainer.classList.remove('top');
  [$rareroomTitle, $homeBackground].forEach(
    (element) => (element.style.display = 'block')
  );
  [$shadow, $mcEmbedShell].forEach(($) => {
    $.classList.remove('active');
  });
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

  $$navButtons.forEach(($navButton) => {
    $navButton.classList.remove('active');
  });
  if (selectedNavButton != null) {
    selectedNavButton.classList.add('active');
  }

  if (artistData !== undefined) {
    const artist = getArtist(artistName);
    if (artist !== undefined) {
      setTimeout(() => {
        $artistSocials.appendChild($socialMediaIconsFactory(artist));
      }, 50);
    }
  }
}
function addBandButtons() {
  linkNewTab($artistNameLink);

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
        if (window.innerWidth <= 600) return;

        $backgroundPicture.classList.add('active');

        for (const $img of $backgroundPicture.children) {
          $img.classList.remove('active');
          if ($img.classList.contains(bandFileName)) {
            $img.classList.add('active');
          }
        }
        $main.classList.add('inverted');
      };

      $band.onmouseleave = (e) => {
        $backgroundPicture.classList.remove('active');
        $main.classList.remove('inverted');
      };
      $band.onclick = (e) => {
        changeState(`artists/${bandFileName}`);
      };

      [$img].forEach(($child) => $band.appendChild($child));

      return $band;
    })();
    $band.onmouseenter = closeSettings;
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
/**
 *
 * @param {string} artistName
 * @returns {string | undefined}
 */
function getArtist(artistName) {
  return artistData.find((artist) => artist.name && artist.name === artistName);
}

export { $main, changeState };
