let simulation = null;
async function startProgram() {
    // Add loading GPU module
    const otMeta = document.createElement('meta');
    otMeta.httpEquiv = 'origin-trial';
    otMeta.content = 'AgtVEPtAKd4ArDYyercRNdboSUW3PN5JArCvCbT9JHWAzx/LzGhZjNJycDqr8o7NfNRfNFS5EPbTkw6eO1Q/ZgUAAABxeyJvcmlnaW4iOiJodHRwczovL3NpbXVsYXRpb25zLm1lY2FuaWNhc2NpZW5jZS5mcjo0NDMiLCJmZWF0dXJlIjoiV2ViR1BVIiwiZXhwaXJ5IjoxNjc1MjA5NTk5LCJpc1N1YmRvbWFpbiI6dHJ1ZX0=';
    document.head.append(otMeta);

    // Create program
    let canvas = document.getElementById('drawing-canvas');
    simulation = new Simulator(canvas);

    // Start
    await simulation.initialize();
    loop();
}

let lastT = Date.now() / 1000;
async function loop() {
    let newT = Date.now() / 1000;
    let dt = newT - lastT;
    lastT = newT;

    // Tick for simulation
    await simulation.tick(dt);

    // Request next frame
    requestAnimationFrame(loop);
}


window.addEventListener("load", startProgram);

