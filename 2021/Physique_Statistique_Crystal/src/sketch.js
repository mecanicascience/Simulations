let plotter;
let FPS = 60;

function init() {
    if (document.readyState != "complete")
        requestAnimationFrame(init);
    else {
        plotter = new Plotter();

        run();
    }
}


let lastUpdateTime = Date.now();
let lastDrawTime   = Date.now();

let maxStandardDeviation = 0.8;
let averageTimeSample = 30;

let dtTotal = 0;
let dtCount = 0;
let mesured_FPS = FPS;

function run() {
    let currentTime = Date.now();
    let dt = (currentTime - lastUpdateTime) / 1000;

    lastUpdateTime = currentTime;
    plotter.update(dt);

    if(currentTime - lastDrawTime >= 1 / FPS) {
        plotter.draw();
        lastDrawTime = currentTime;
    }

    dtTotal += dt;
    dtCount += 1;
    if (dtCount % averageTimeSample == 0) {
        mesured_FPS = 1 / (dtTotal / dtCount);
        document.getElementById('FPS_count').textContent = Math.round(mesured_FPS).toString() + ' FPS';
        dtTotal = 0;
        dtCount = 0;
    }

    requestAnimationFrame(run);
}





function noLoop() {
    plotter.noLoop = true;
}

function loop() {
    plotter.noLoop = false;
    plotter.stepMode = false;
    plotter.logInfo = false;
}

function step() {
    plotter.stepMode = true;
    plotter.noLoop = false;
}

function logInfo() {
    plotter.logInfo = true;
}

requestAnimationFrame(init);
