async function startProgram() {
    // Add loading GPU module
    const otMeta = document.createElement('meta');
    otMeta.httpEquiv = 'origin-trial';
    otMeta.content = 'At1jPeuFXCt191Pn9+xzTx3LBGz6cGgJs4bvmdpABMiyunk7mYZer6asAoiOi5J0vl/3AbziGOGZx6jQx5OPiwUAAABleyJvcmlnaW4iOiJodHRwczovL21lY2FuaWNhc2NpZW5jZS5mcjo0NDMiLCJmZWF0dXJlIjoiV2ViR1BVIiwiZXhwaXJ5IjoxNjYzNzE4Mzk5LCJpc1N1YmRvbWFpbiI6dHJ1ZX0=';
    document.head.append(otMeta);

    // Check WebGPU compatibility
    if (navigator.gpu == undefined)
        console.log("wsh");
    if (navigator.gpu == undefined)
        throw new Error('WebGPU is not supported on this browser.');

    // Start WebGPU Simulator
    let canvas = document.getElementById('drawing-canvas');
    let simulator = new WebGPUSimulator(canvas);
    
    // Initialize simulator
    await simulator.initialize();

    // Start engine
    simulator.run();
}


window.addEventListener("load", startProgram);
