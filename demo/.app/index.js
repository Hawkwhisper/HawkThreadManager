/**
 * Contains async functionality for functions that didn't originally support it.
 */
const ThreadManager = require('./libs/htman');
// Create two canvases and their 2D contexts
const canvas = document.createElement('canvas');
const canvas_copy = document.createElement('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const ctx_copy = canvas_copy.getContext('2d', { willReadFrequently: true });

// Append the main canvas to the body
document.body.appendChild(canvas);

// Initialize ThreadManager and define the number of threads
const main = new ThreadManager();
const Threads = 10;
const _threadValues = [];
for (let i = 0; i < Threads; i++) _threadValues.push({ start: 0, end: 0 });
const resolutionDivider = 8;

//Initialize particle array
const _particles = [];
const _maxParticles = 15421;
for (let i = 0; i < _maxParticles; i++) _particles.push({ x: 0, y: 0, xvel: 0, yvel: 0 });

require('./demo/buffers.js');

// Initialize mouse options
const mouse = main.assignKeys('mouse', ['x', 'y', 'active'])[0];
document.body.addEventListener('mousemove', e => {
    mouse.x = Math.floor(e.pageX / resolutionDivider);
    mouse.y = Math.floor(e.pageY / resolutionDivider);
})

document.body.addEventListener('mousedown', e => {
    // add 1 since we use 0 as "off"
    mouse.active = e.button + 1;
});

document.body.addEventListener('mouseup', () => {
    mouse.active = 0;
});



// Set screen size
requestResize();

// Used to determine the start/end index of the particles the threads should access
(() => {
    const { init, update, begin } = require('./demo/wk.particleUpdater.js');
    const count = _particles.length;

    for (let i = 0; i < Threads; i++) {
        const start = Math.floor((i / Threads) * count);
        const end = Math.floor(((i + 1) / Threads) * count);

        thread_limits[i].start = start;
        thread_limits[i].end = end;

        main.task(init, update).then(begin).catch(e=>console.log(e));

    }
})();

for (let i = 0; i < particles.length; i++) {
    const initialX = i%screen.width;
    const initialY = (Math.floor(i / screen.width))%screen.height;
    particles[i].xvel= Math.random()-0.5;
    particles[i].yvel= Math.random()-0.5;
    particles[i].x = initialX;
    particles[i].y = initialY;
}


function requestResize() {
    screen.width = Math.floor(window.innerWidth / resolutionDivider);
    screen.height =Math.floor( window.innerHeight / resolutionDivider);
    canvas.width = screen.width;
    canvas.height = screen.height;
    canvas_copy.width = screen.width;
    canvas_copy.height = screen.height;

    main.resizeShare("ImageData", (screen.width * screen.height) * 4, Uint8Array)

    imageData = ctx.createImageData(canvas.width, canvas.height)
imageData.data.set(main._shares.ImageData);
}
window.addEventListener('resize', requestResize);