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

// Global vars
let localStorageSettings = localStorage.getItem('settings');
let settings = {
    light: true,
    sound: true,
};
let flashingInterval = null;

// Elements
const [ $canvaContent, $canvaIframeHome, $canvaIframeContact, $canvaIframeAbout, $content, $contactButton, $aboutButton, $homeLogo, $homeAudio, $aboutAudio, $contactAudio, $morseFlash, $settings, $settingsArrowDown, $settingsX, $socialMediaIcons, $settingsBorder ] = [ 'canva-content', 'canva-iframe-home', 'canva-iframe-contact', 'canva-iframe-about', 'content', 'contact-button', 'about-button', 'home-logo', 'home-audio', 'about-audio', 'contact-audio','morse-flash', 'settings', 'settings-arrow-down', 'settings-x', 'social-media-icons', 'settings-border' ].map(id => document.getElementById(id));
const [ [ $nav ], [ $aboutText ] ] = [ 'nav', ':scope > p' ].map(descriptor => $content.querySelectorAll(descriptor));
const [ $$switch ] = [ '.switch' ].map(descriptor => document.querySelectorAll(descriptor));

function main() {
    if (localStorageSettings) {
        settings = JSON.parse(localStorageSettings);
    }
    [$homeAudio, $aboutAudio, $contactAudio].forEach($audio => {
        $audio.volume = 0.075;
    });
    ['sound', 'light'].forEach(selector => {
        /** @type {Element} */
        const $switch = [].find.call($$switch, /** @param {Element} $switch */ $switch => {
            return $switch.matches(`.${selector}`);
        })
        console.log($switch);
        if (settings[selector]) {
            $switch.classList.add('active');
        } else {
            $switch.classList.remove('active');
        }
    })
    $$switch.forEach($switch => createSwitch($switch));
    
    updataCanvaContentPosition();
}

// Functions
function updataCanvaContentPosition() {
    let width = window.innerWidth;
    let height = window.innerHeight;

    if (width / height > canvaRatioPixel) {
        $canvaContent.style.width = `${canvaWidthPercent}%`;
        $canvaContent.style.paddingTop = `${canvaHeightPercent}%`;
    } else {
        $canvaContent.style.width = `${100 * canvaRatioPixel / (width / height)}%`;
        $canvaContent.style.paddingTop = `${100 * canvaRatioPixel / (width / height)}%`;

    }
    
    $canvaContent.style.left = ((width - $canvaContent.offsetWidth) / 2) + "px";
    $canvaContent.style.top = ((height - $canvaContent.offsetHeight) / 2) + "px";

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
function setIframe(iframe) {
    [$canvaIframeHome, $canvaIframeAbout].forEach(iframe => {
        //iframe.style.display = 'none';
        iframe.style.zIndex = '-2';
    });
    //iframe.style.display = 'block';
    iframe.style.zIndex = '0';
}
function playMorse($audioElement, morse) {
    $morseFlash.classList.remove('active');
    if (flashingInterval) {
        clearInterval(flashingInterval);
        flashingInterval = null;
    }
    setTimeout(async () => {
        if (settings.sound) {
            await $audioElement.play();
        }
        if (settings.light) {
            await wait(flashDelay);
            await flashMorseCode(morseTiming(morse));
        }
    }, audioDelay);
}

async function flashMorseCode(times) {
    let i = 0;
    let j = 0;
    const startDate = Date.now();
    let offset = 0;

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
            }
        })
        localStorage.setItem('settings', JSON.stringify(settings));
    })
}

// Event Listeners
window.addEventListener('DOMContentLoaded', main);
window.addEventListener('resize', updataCanvaContentPosition);
$contactButton.addEventListener('click', () => {
    $nav.style.display = 'none';
    $aboutText.style.display = 'none';
    $socialMediaIcons.style.display = 'block';
    setIframe($canvaIframeContact); 
    [$homeAudio, $aboutAudio, $contactAudio].forEach($audio => {
        $audio.pause();
        $audio.currentTime = 0;
    });
    playMorse($contactAudio, "-.-. --- -. - .- -.-. -");
});
$aboutButton.addEventListener('click',() => { 
    $nav.style.display = 'none';
    $socialMediaIcons.style.display = 'none';
    $aboutText.style.display = 'block';
    setIframe($canvaIframeAbout); 
    [$aboutAudio, $homeAudio, $contactAudio].forEach($audio => {
        $audio.pause();
        $audio.currentTime = 0;
    });
    playMorse($aboutAudio, ".- -... --- ..- -");
});
$homeLogo.addEventListener('click', () => {
    $aboutText.style.display = 'none';
    $socialMediaIcons.style.display = 'none';
    $nav.style.display = 'block';
    setIframe($canvaIframeHome);
    [$homeAudio, $aboutAudio, $contactAudio].forEach($audio => {
        $audio.pause();
        $audio.currentTime = 0;
    });
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
