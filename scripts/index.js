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
const letterGap = 110;
const wordGap = 190;
const dot = 45;
const dash = 100;

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
        /** @type {AudioElement} */
        let test = $contactAudio;
        if (!flashing) {
        // -.-. --- -. - .- -.-. -
        let times = [
            [dash, letterGap], [dot, letterGap], [dash, letterGap], [dot, wordGap],
            [dash, letterGap], [dash, letterGap], [dash, wordGap],
            [dash, letterGap], [dot, wordGap],
            [dash, wordGap],
            [dot, letterGap], [dash, wordGap],
            [dash, letterGap], [dot, letterGap], [dash, letterGap], [dot, wordGap],
            [dash, wordGap],
        ];
        await flashMorseCode(times);
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
        if (!flashing) {
        // .- -... --- ..- -
        let times = [
            [dot, letterGap], [dash, wordGap],
            [dash, letterGap], [dot, letterGap], [dot, letterGap], [dot, wordGap],
            [dash, letterGap], [dash, letterGap], [dash, wordGap],
            [dot, letterGap], [dot, letterGap], [dash, wordGap],
            [dash, wordGap],
        ];
        await flashMorseCode(times);
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
        if (!flashing) {
        let times = [
            [dot, letterGap], [dash, letterGap], [dot, wordGap],
            [dot, letterGap], [dash, wordGap],
            [dot, letterGap], [dash, letterGap], [dot, wordGap],
            [dot, wordGap],
            [dot, letterGap], [dash, letterGap], [dot, wordGap],
            [dash, letterGap], [dash, letterGap], [dash, wordGap],
            [dash, letterGap], [dash, letterGap], [dash, wordGap],
            [dash, letterGap], [dash, wordGap],
        ];
        await flashMorseCode(times);
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
