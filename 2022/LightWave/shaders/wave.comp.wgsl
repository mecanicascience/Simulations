// Grid values
struct Grid {
    points : array<f32>
};
@group(0) @binding(0) var<storage, read> inGridBefore : Grid;
@group(0) @binding(1) var<storage, read> inGridCurrent : Grid;
@group(0) @binding(2) var<storage, read_write> inGridAfter : Grid;
@group(0) @binding(3) var<storage, read_write> inGridEnergy : Grid;
@group(0) @binding(4) var<storage, read> inGridSpeedValues : Grid;

// Grid configuration
struct GridConfig {
    size: vec2<f32>,
    deltat: f32,
    deltax: f32,
    deltay: f32,
    lightSpeed: f32,
    damping: f32,
    energyAvgCount: f32
};
@group(1) @binding(0) var<uniform> inGridConfig : GridConfig;

struct SinWaveConfig {
    amplitude: f32,
    pulsation: f32,
    maxt : f32,
    currentt: f32
};
@group(1) @binding(1) var<uniform> inSinWaveConfig : SinWaveConfig;



@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    var x = i32(global_id.x);
    var y = i32(global_id.y);
    if (x >= i32(inGridConfig.size.x) || y >= i32(inGridConfig.size.y)) {
        return;
    }

    // Create sin wave at origin in x
    var index = x + y * i32(inGridConfig.size.x);
    if (x == 0 && (inSinWaveConfig.maxt == 0.0 || inSinWaveConfig.currentt <= inSinWaveConfig.maxt) && y < i32(inGridConfig.size.y * 0.8) && y > i32(inGridConfig.size.y * 0.2)) {
        inGridAfter.points[index] = inSinWaveConfig.amplitude * sin(inSinWaveConfig.currentt * inSinWaveConfig.pulsation + 3.141592653/4.0);
        return;
    }

    // Update grid value
    var v = inGridConfig.lightSpeed * inGridSpeedValues.points[index];
    var laplacianX = (currValAt(x + 1, y) - 2.0 * currValAt(x, y) + currValAt(x - 1, y)) / (inGridConfig.deltax*inGridConfig.deltax);
    var laplacianY = (currValAt(x, y + 1) - 2.0 * currValAt(x, y) + currValAt(x, y - 1)) / (inGridConfig.deltay*inGridConfig.deltay);
    var newVal     = (laplacianX + laplacianY) * v*v * inGridConfig.deltat*inGridConfig.deltat
                                    + 2.0 * currValAt(x, y)
                                    - inGridBefore.points[index];

    // Update value
    inGridAfter.points[index] = newVal * (1.0 - inGridConfig.damping);

    // Update energy
    inGridEnergy.points[index] += inGridAfter.points[index]*inGridAfter.points[index];
}


// ======= UTILS ========
// Return the current value of the element at given coordinates, handle edges
fn currValAt(x : i32, y : i32) -> f32 {
    var coordsAbs = vec2<f32>(f32(x), f32(y)); 

    // Boundaries for X axis
    var boundaryVal = 0.0; // Solid
    // var boundaryVal = inGridCurrent.points[x + y * i32(inGridConfig.size.x)]; // Copy value

    // Check if x in range
    if (coordsAbs.x >= inGridConfig.size.x) { return boundaryVal; }
    else if (coordsAbs.x < 0.0) { return boundaryVal; }

    // Check if y in range => boundary conditions on Y axis
    // if (coordsAbs.y >= inGridConfig.size.y) { coordsAbs.y -= inGridConfig.size.y; }
    // else if (coordsAbs.y < 0.0) { coordsAbs.y += inGridConfig.size.y; }

    // Check if y in range => solid conditions on Y axis
    if (coordsAbs.y >= inGridConfig.size.y) { return boundaryVal; }
    else if (coordsAbs.y < 0.0) { return boundaryVal; }

    return inGridCurrent.points[u32(round(coordsAbs.x) + round(coordsAbs.y) * inGridConfig.size.x)];
}
