// Initialization function to set up variables and shared data
function init() {
    // Make it so we can access particles[index].x, etc
    // - NOTE: assignKeys will always return an array, might patch
    //         that later but I'm tired asf lol, so...
    const particles = assignKeys('particles', ['x', 'y', 'xvel', 'yvel']);
    // Make it so we can access screen.width/screen.height.
    const screen = assignKeys('screen', ['width', 'height', 'clearing'])[0];
    // Make it so we can access the mouse.
    const mouse = assignKeys('mouse', ['x', 'y', 'active'])[0];
    // Define the start/end index (batch of particles this thread should update).
    const { start, end } = assignKeys('workload', ['start', 'end'])[$index];
    // The image data share
    const Pixel = self.$shares.ImageData;

    // Assigning variables to the worker's self object
    self.particles = particles;
    self.screen = screen;
    self.mouse = mouse;
    self.start = start;
    self.end = end;
    self.Pixel = Pixel;
    self._percent = start;
}

// Update function for particle simulation
function update() {
    const time = new Date().getTime();
    for (let i = _percent; i < end; i++) {
        const particle = particles[i];
        _percent = i;


        // Update particle position and color
        const nextParticleX = (Math.floor(particle.y) * screen.width + Math.floor(particle.x + particle.xvel)) * 4;
        const nextParticleY = (Math.floor(particle.y + particle.yvel) * screen.width + Math.floor(particle.x)) * 4;
        if (particle.y > 1) {
            const pixelIndex = (Math.floor(particle.y) * screen.width + Math.floor(particle.x)) * 4;
            Pixel[pixelIndex] = Math.max(0, ((Math.abs(particle.yvel + particle.xvel) / 4.8) * 255) - Pixel[pixelIndex + 3] / 4);
            Pixel[pixelIndex + 1] = Math.max(48, Math.min(255, (1.5 * Pixel[pixelIndex])));
            Pixel[pixelIndex + 2] = 255;
            Pixel[pixelIndex + 3] = (Pixel[pixelIndex + 3] + (255 - Pixel[pixelIndex + 3]) * 0.25);
        }

        particle.yvel += 0.09;
        let dx = (mouse.x - particle.x);
        let dy = (mouse.y - particle.y);

        if (mouse.active > 1) {
            dx = -dx;
            dy = -dy;
        }
        if (mouse.active != 0) {
            const distance = Math.sqrt(dx ** 2 + dy ** 2);
            let damping = .5 / (4 * distance) / (1 + Math.abs(particle.xvel / (end - i)));

            if (distance > $index) {
                // Interpolate velocities for a smoother transition
                particle.xvel = particle.xvel + (dx - particle.xvel) * damping;
                particle.yvel = particle.yvel + (dy - particle.yvel) * damping;
            }
        }

        // Limit the velocity to a certain range
        particle.xvel = Math.min(Math.max(particle.xvel, -3), 3);
        particle.yvel = Math.min(Math.max(particle.yvel, -999), 1.8);

        // Update particle positions based on velocity
        particle.x += particle.xvel;
        particle.y += particle.yvel;

        // Synthetic collision for horizontal interaction (e.g., splashes)
        if (Pixel[nextParticleX + 3] > 200) {
            // Random adjustment to the vertical velocity
            let adjust = 0.45 * (Math.random() * (particle.xvel));

            // Gradually reduce horizontal velocity if it's large
            if (Math.abs(particle.xvel) > 1) particle.xvel /= 1.025;

            // Adjust the vertical velocity based on the particle's direction
            particle.yvel -= particle.yvel < 0 ? adjust : -adjust;
        }

        // Synthetic collision for vertical interaction (e.g., bounces)
        if (Pixel[nextParticleY + 3] > 144 && particle.yvel > 0) {
            // Store the current vertical velocity for adjustment
            let adjust = particle.yvel * 0.998;

            // Move the particle upward based on the adjustment
            particle.y -= Math.max(1, Math.abs(adjust));

            // Adjust the vertical velocity based on the stored value
            particle.yvel -= adjust;

            // Additional adjustments if the horizontal velocity is significant
            if (Math.abs(particle.xvel) > Math.abs(particle.yvel)) {
                // Introduce a random change to the horizontal velocity
                particle.xvel += 0.5 * (Math.random() - 0.5);

                // Increase the vertical velocity for potential splash effect
                particle.yvel *= 1.9;
            }

            // Further increase the vertical velocity if it's very small
            if (particle.yvel < 0.1) particle.yvel *= 1.9;
        }

        // Bounce off walls
        if (particle.x < 1 || particle.x >= screen.width - 1) {
            // Gradual change in velocity direction
            particle.xvel = -particle.xvel / 1.05;
        }

        if (particle.y >= screen.height - 1) {
            // Gradual change in velocity direction
            particle.yvel = -particle.yvel / (1 + Math.random());
        }

        // Limit particle velocity
        particle.x = Math.min(Math.max(particle.x, 1), screen.width - 1);
        particle.y = Math.min(particle.y, screen.height);

        // Break the loop if time exceeds 16.6 milliseconds
        if (new Date().getTime() - time > 16.6) break;
    }
    if (_percent == end - 1) {
        _percent = start;
        self.postMessage('done');
    }
}

// Function to manage multiple updaters and clearing the screen
let count = 0;
let interval;
const _updaters = [];

function tick() {
    if (!interval) interval = setInterval(() => {

        // Iterate through updaters and trigger tick
        _updaters.map((u, i) => {
            u.tick();
        });

        // Clear the screen or update as needed
        if (screen.clearing) {
            main._shares.ImageData.fill(0);
            screen.clearing = 0;
            count = 0;
        } else {
            // Additional logic for updates if not clearing the screen
        }

    }, 1000 / 60);
}

// Function to start the particle simulation
function begin(worker) {
    // Trigger initial tick for the worker
    worker.tick();

    // Listen for messages from the worker
    worker.on('message', data => {
        if (screen.clearing) return;
        count++;

        // When all workers are done, clear the screen and apply a 
        // motion-blur like effect <3
        if (count == Threads) {
            screen.clearing = 1;
            imageData.data.set(main._shares.ImageData);
            ctx.putImageData(imageData, 0, 0);
            ctx.globalCompositeOperation = 'overlay';
            ctx.globalAlpha = 0.7;
            ctx.drawImage(canvas_copy, 0, 0);
            ctx.globalAlpha = 0.15;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-atop';
            ctx_copy.drawImage(canvas, 0, 0);
        }
    });

    // Add the worker to the list of updaters
    _updaters.push(worker);
}

// Request animation frame to start the tick function
requestAnimationFrame(tick);

// Export the functions for external use
module.exports = { init, update, begin };