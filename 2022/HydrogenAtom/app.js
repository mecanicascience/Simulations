function getConfig() {
    return [
        parseInt(document.getElementById('param_n').value),
        parseInt(document.getElementById('param_l').value),
        parseInt(document.getElementById('param_m').value),
        parseInt(document.getElementById('param_opacity').value),
        parseInt(document.getElementById('param_z').value)
    ];
}

async function startProgram() {
    // Add loading GPU module
    const otMeta = document.createElement('meta');
    otMeta.httpEquiv = 'origin-trial';
    otMeta.content = 'At1jPeuFXCt191Pn9+xzTx3LBGz6cGgJs4bvmdpABMiyunk7mYZer6asAoiOi5J0vl/3AbziGOGZx6jQx5OPiwUAAABleyJvcmlnaW4iOiJodHRwczovL21lY2FuaWNhc2NpZW5jZS5mcjo0NDMiLCJmZWF0dXJlIjoiV2ViR1BVIiwiZXhwaXJ5IjoxNjYzNzE4Mzk5LCJpc1N1YmRvbWFpbiI6dHJ1ZX0=';
    document.head.append(otMeta);

    // Check WebGPU compatibility
    if (navigator.gpu == undefined) {
        const errorDom = document.createElement('p');
        errorDom.innerHTML = "Your browser doesn't support WebGPU.\nPlease use one of the last Google Chrome version.";
        document.getElementById('error_div').append(errorDom);
        throw new Error('WebGPU is not supported on this browser.');
    }

    // Start WebGPU Simulator
    let canvas = document.getElementById('drawing-canvas');
    let simulator = new WebGPUSimulator(canvas);
    
    // Initialize simulator
    await simulator.initialize();

    // Start engine
    await simulator.run();
}


window.addEventListener("load", startProgram);
