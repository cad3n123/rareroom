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

// Elements
const [ $canvaContent, $canvaIframeHome, $canvaIframeAbout, $content, $contactButton, $aboutButton, $homeLogo, ] = [ 'canva-content', 'canva-iframe-home', 'canva-iframe-about', 'content', 'contact-button', 'about-button', 'home-logo' ].map(id => document.getElementById(id));
const [ [ $nav ], [ $aboutText ] ] = [ 'nav', ':scope > p' ].map(descriptor => $content.querySelectorAll(descriptor));

function main() {
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
$contactButton.addEventListener('click', () => { setIframe(contactURL); });
$aboutButton.addEventListener('click', () => { 
    $nav.style.display = 'none';
    $aboutText.style.display = 'block';
    console.log($aboutText);
    setIframe($canvaIframeAbout); 
});
$homeLogo.addEventListener('click', () => { 
    $nav.style.display = 'block';
    $aboutText.style.display = 'none';
    setIframe($canvaIframeHome); 
});
