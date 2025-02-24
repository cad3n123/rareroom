// Elements
const [ $canvaContent ] = [ 'canva-content' ].map(id => document.getElementById(id));

function main() {
    setInterval(updataCanvaContentPosition, 100);
    updataCanvaContentPosition();
}

// Functions
function updataCanvaContentPosition() {
    let width = window.innerWidth;
    let height = window.innerHeight;
    console.log($canvaContent.offsetHeight);
    $canvaContent.style.left = ((width - $canvaContent.offsetWidth) / 2) + "px";
    $canvaContent.style.top = ((height - $canvaContent.offsetHeight) / 2) + "px";
}

// Event Listeners
window.addEventListener('load', main);