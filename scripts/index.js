// Constant Variables
const canvaBaseWidthPixel = 1366;
const canvaBaseHeightPixel = 768;
const canvaRatioPixel = 1366/768;
const canvaBaseWidthPercent = 100;
const canvaBaseHeightPercent = 56.2225;
const canvaScale = 1.1;
const canvaWidthPercent = canvaBaseWidthPercent * canvaScale;
const canvaHeightPercent = canvaBaseHeightPercent * canvaScale;
const homeURL = 'https://www.canva.com/design/DAGgCFOLnQU/IghWNzf-q0ltWVUEDiCkvA/view?embed';
const aboutURL = 'https://www.canva.com/design/DAGgDNNskO8/nrhCTo31fi1cd9J3DP1tqA/view?embed';
const audioDelay = 500;
// const letterGap = 110;
// const wordGap = 190;
// const dot = 45;
// const dash = 100;
const dot = 120;
const dash = 240;
const letterGap = 120;
const flashDelay = 100;
//const wordGap = 190;

// Global vars
let flashing = false;

// Elements
const [ $canvaContent, $canvaIframeHome, $canvaIframeAbout, $content, $contactButton, $aboutButton, $homeLogo, $homeAudio, $aboutAudio, $contactAudio, $morseFlash ] = [ 'canva-content', 'canva-iframe-home', 'canva-iframe-about', 'content', 'contact-button', 'about-button', 'home-logo', 'home-audio', 'about-audio', 'contact-audio','morse-flash' ].map(id => document.getElementById(id));
const [ [ $nav ], [ $aboutText ] ] = [ 'nav', ':scope > p' ].map(descriptor => $content.querySelectorAll(descriptor));

function main() {
    [$homeAudio, $aboutAudio, $contactAudio].forEach($audio => {
        $audio.volume = 0.1;
    });
    
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
}
function setIframe(iframe) {
    [$canvaIframeHome, $canvaIframeAbout].forEach(iframe => {
        //iframe.style.display = 'none';
        iframe.style.zIndex = '-2';
    });
    //iframe.style.display = 'block';
    iframe.style.zIndex = '0';
}

// Event Listeners
window.addEventListener('DOMContentLoaded', main);
window.addEventListener('resize', updataCanvaContentPosition);
$contactButton.addEventListener('click', () => {
    [$homeAudio, $aboutAudio, $contactAudio].forEach($audio => {
        $audio.pause();
        $audio.currentTime = 0;
    });
    setTimeout(async () => {
        await $contactAudio.play();
        await wait(flashDelay);
        if (!flashing) {
            await flashMorseCode(morseTiming("-.-. --- -. - .- -.-. -"));
        }
    }, audioDelay);
});
$aboutButton.addEventListener('click',() => { 
    $nav.style.display = 'none';
    $aboutText.style.display = 'block';
    console.log($aboutText);
    setIframe($canvaIframeAbout); 
    [$aboutAudio, $homeAudio, $contactAudio].forEach($audio => {
        $audio.pause();
        $audio.currentTime = 0;
    });
    setTimeout(async () => {
        await $aboutAudio.play();
        await wait(flashDelay);
        if (!flashing) {
            await flashMorseCode(morseTiming(".- -... --- ..- -"));
        }
    }, audioDelay);
});
$homeLogo.addEventListener('click', () => {
    $nav.style.display = 'block';
    $aboutText.style.display = 'none';
    setIframe($canvaIframeHome);
    [$homeAudio, $aboutAudio, $contactAudio].forEach($audio => {
        $audio.pause();
        $audio.currentTime = 0;
    });

    setTimeout(async () => {
        await $homeAudio.play();
        await wait(flashDelay);
        if (!flashing) {
            await flashMorseCode(morseTiming(".-. .- .-. . .-. --- --- --"));
        }
    }, audioDelay);
});
async function flashMorseCode(times) {
    flashing = true;
    for (let i = 0; i < times.length; i++) {
        let pair = times[i];
        $morseFlash.classList.add('active');
        await wait(pair[0]);
        $morseFlash.classList.remove('active');
        await wait(pair[1]);
    }
    flashing = false;
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
