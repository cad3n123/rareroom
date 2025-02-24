// Constant Variables
const canvaBaseWidthPixel = 1366;
const canvaBaseHeightPixel = 768;
const canvaRatioPixel = 1366/768;
const canvaBaseWidthPercent = 100;
const canvaBaseHeightPercent = 56.2225;
const canvaScale = 1.1;
const canvaWidthPercent = canvaBaseWidthPercent * canvaScale;
const canvaHeightPercent = canvaBaseHeightPercent * canvaScale;

// Elements
const [ $canvaContent ] = [ 'canva-content' ].map(id => document.getElementById(id));

function main() {
    //setInterval(updataCanvaContentPosition, 100);
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
    
    // const windowRatioPixel = width / height;
    // $canvaContent.style.width = `${canvaWidthPercent * canvaRatioPixel / windowRatioPixel}%`;
    // $canvaContent.style.paddingTop = `${canvaHeightPercent * canvaRatioPixel / windowRatioPixel}%`;
    
    console.log($canvaContent.offsetHeight);
    $canvaContent.style.left = ((width - $canvaContent.offsetWidth) / 2) + "px";
    $canvaContent.style.top = ((height - $canvaContent.offsetHeight) / 2) + "px";
}

// Event Listeners
window.addEventListener('DOMContentLoaded', main);
window.addEventListener('resize', updataCanvaContentPosition);