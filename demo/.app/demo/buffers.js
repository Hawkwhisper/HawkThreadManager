// -- > Shared Buffer Creations
const __initLen = ((window.innerWidth / resolutionDivider) * (window.innerHeight / resolutionDivider));

// Convert the particle array into a usable buffer, we use * 4 because we have x, y, xvel and yvel
main.createSharedBuffer("particles", _particles.length * 4, Float32Array);
// Define window's innerwidth/height
main.createSharedBuffer("screen", 3, Uint16Array);
// Define the mouse
main.createSharedBuffer("mouse", 3, Uint16Array);
// Image data for each to write to
main.createSharedBuffer("ImageData",  (canvas.width*canvas.height) * 4, Uint8Array);
// Used to tell the main thread when its time to rener
main.createSharedBuffer("renderCount", 2, Uint8Array);
// Divides workloads
main.createSharedBuffer("workload", _threadValues.length * 2, Uint32Array);

// -- > Key assignments

// access via particle[index].x, .y, .xvel, .yvel, etc
particles = main.assignKeys('particles', ['x', 'y', 'xvel', 'yvel']);
screen = main.assignKeys('screen', ['width', 'height', 'clearing'])[0];
thread_limits = main.assignKeys('workload', ['start', 'end']);
TotalRenders = main.assignKeys('renderCount', ['value'])[0];
imageData = ctx.createImageData(canvas.width, canvas.height)
imageData.data.set(main._shares.ImageData);