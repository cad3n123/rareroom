// Constant Variables
const canvaBaseWidthPixel = 1366;
const canvaBaseHeightPixel = 768;
const canvaRatioPixel = 1366/768;
const canvaBaseWidthPercent = 100;
const canvaBaseHeightPercent = 56.2225;
const canvaScale = 1.1;
const canvaWidthPercent = canvaBaseWidthPercent * canvaScale;
const canvaHeightPercent = canvaBaseHeightPercent * canvaScale;
const flashDelay = 125;
const dot = 120;
const dash = 240;
const letterGap = 120;
const audioDelay = 2 * letterGap;
const volume = 0.075;

// TODO
// Try only the logo flashes (inverted or the current one only on the logo)

// Global vars
let localStorageSettings = localStorage.getItem('settings');
let settings = {
    light: false,
    sound: true,
};
let flashingInterval = null;

// Elements
const [ $backgroundContent, $homeBackground, $contactBackground, $aboutBackground, $content, $contactButton, $aboutButton, $homeLogo, $homeAudio, $aboutAudio, $contactAudio, $morseFlash, $settings, $settingsArrowDown, $settingsX, $socialMediaIcons, $settingsBorder ] = [ 'background-content', 'home-background', 'contact-background', 'about-background', 'content', 'contact-button', 'about-button', 'home-logo', 'home-audio', 'about-audio', 'contact-audio','morse-flash', 'settings', 'settings-arrow-down', 'settings-x', 'social-media-icons', 'settings-border' ].map(id => document.getElementById(id));
const [ [ $nav ], [ $aboutText ] ] = [ 'nav', ':scope > p' ].map(descriptor => $content.querySelectorAll(descriptor));
const [ $$switch ] = [ '.switch' ].map(descriptor => document.querySelectorAll(descriptor));

function main() {
    if (localStorageSettings) {
        settings = JSON.parse(localStorageSettings);
    }
    setVolume(settings.sound ? volume : 0);
    ['sound', 'light'].forEach(selector => {
        /** @type {Element} */
        const $switch = [].find.call($$switch, /** @param {Element} $switch */ $switch => {
            return $switch.matches(`.${selector}`);
        })
        if (settings[selector]) {
            $switch.classList.add('active');
        } else {
            $switch.classList.remove('active');
        }
    })
    $$switch.forEach($switch => createSwitch($switch));
    
    updataContentPosition();
}

function setVolume(volume) {
    [$homeAudio, $aboutAudio, $contactAudio].forEach($audio => {
        $audio.volume = volume;
    });
}

// Functions
function updataContentPosition() {
    // Flash
    $morseFlash.style.width = `${$homeLogo.offsetWidth}px`;
    $morseFlash.style.height = `${$homeLogo.offsetHeight}px`;

    // Settings
    $settings.style.setProperty('--closed-top', `-${$settings.offsetHeight}px`)
    $settings.style.setProperty('--closed-left', `-${$settings.offsetWidth}px`)

    $settingsBorder.style.setProperty('--top', `${($settings.offsetHeight - $settingsBorder.offsetHeight) / 2}px`)
    $settingsBorder.style.setProperty('--left', `${($settings.offsetWidth - $settingsBorder.offsetWidth) / 2}px`)

    $settingsArrowDown.style.setProperty('--left', `${($settings.offsetWidth - $settingsArrowDown.offsetWidth) / 2}px`);
    $settingsArrowDown.style.setProperty('--top', `${($settings.offsetHeight - $settingsArrowDown.offsetHeight) / 2}px`);
    $settingsArrowDown.style.setProperty('--margin-top', `${$settings.offsetHeight}px`);
    $settingsArrowDown.style.setProperty('--margin-left', `${$settings.offsetWidth}px`);
}
function setBackground(background) {
    [$homeBackground, $contactBackground, $aboutBackground].forEach(background => {
        //iframe.style.display = 'none';
        background.style.zIndex = '-2';
    });
    //iframe.style.display = 'block';
    background.style.zIndex = '0';
}
function playMorse($audioElement, morse) {
    $morseFlash.classList.remove('active');
    if (flashingInterval) {
        clearInterval(flashingInterval);
        flashingInterval = null;
    }
    setTimeout(async () => {
        await $audioElement.play();
        
        await wait(flashDelay);
        await flashMorseCode(morseTiming(morse));
        
    }, audioDelay);
}

async function flashMorseCode(times) {
    let i = 0;
    let j = 0;
    const startDate = Date.now();
    let offset = 0;

    if (settings.light) 
        $morseFlash.classList.add('active');
    
    flashingInterval = setInterval(() => {
        const currentDate = Date.now()

        while (currentDate - (startDate + offset) > times[i][j]) {
            offset += times[i][j]
            if (j == 0) {
                $morseFlash.classList.remove('active');
            } else if (i + 1 >= times.length) {
                $morseFlash.classList.remove('active');
                clearInterval(flashingInterval);
                flashingInterval = null;
                break;
            } else {
                if (settings.light)
                    $morseFlash.classList.add('active');
                i++;
            }
            j = 1 - j;
        }
    }, 1);
}
function wait(milliseconds) {
    return new Promise(resolve => {
       setTimeout(resolve, milliseconds);
    });
} 
/**
 * 
 * @param {string} morse 
 * @returns {Array[Array[number]]}
 */
function morseTiming(morse) {
    morse += " ";
    let times = [];
    for (let i = 0; i < morse.length - 1; i++) {
        let char = morse[i];
        let nextChar = morse[i + 1];
        let length1 = char == '.' ? dot/2 : dash/2;
        let length2 = length1 + (nextChar == ' ' ? letterGap : 0);
        times.push([length1, length2]);

        if (nextChar == " ") {
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
    [$bar, $node].forEach($ => $switch.appendChild($));
    
    $switch.addEventListener('click', e => {
        $switch.classList.toggle('active');
        [ 'sound', 'light' ].forEach(descriptor => {
            if ($switch.classList.contains(descriptor)) {
                settings[descriptor] = !settings[descriptor];
                setVolume(settings.sound ? volume : 0);
            }
        })
        localStorage.setItem('settings', JSON.stringify(settings));
    })
}

// Event Listeners
window.addEventListener('DOMContentLoaded', main);
window.addEventListener('load', updataContentPosition);
window.addEventListener('resize', updataContentPosition);
$contactButton.addEventListener('click', () => {
    switchPage(
        $contactBackground, 
        [
            {
                element: $socialMediaIcons,
                displayMode: "block"
            }
        ]
    );
    playMorse($contactAudio, "-.-. --- -. - .- -.-. -");
});
$aboutButton.addEventListener('click',() => { 
    switchPage(
        $aboutBackground, 
        [
            {
                element: $aboutText,
                displayMode: "block"
            }
        ]
    );
    playMorse($aboutAudio, ".- -... --- ..- -");
});
$homeLogo.addEventListener('click', () => {
    switchPage(
        $homeBackground, 
        [
            {
                element: $nav,
                displayMode: "block"
            }
        ]
    );
    playMorse($homeAudio, ".-. .- .-. . .-. --- --- --");
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
 * @param {ElementSettings[]} elementSettings 
 */
function switchPage(background, elementSettings) {
    [$homeAudio, $aboutAudio, $contactAudio].forEach($audio => {
        $audio.pause();
        $audio.currentTime = 0;
    });
    if (background.style.zIndex != 0) {
        [$nav, $aboutText, $socialMediaIcons].forEach(element => {
            element.style.display = 'none';
        });
        elementSettings.forEach(elementSetting => {
            elementSetting.element.style.display = elementSetting.displayMode;
        });
        $settings.classList.remove('active');
        $settingsArrowDown.classList.add('active');
        setBackground(background);
    }
}

