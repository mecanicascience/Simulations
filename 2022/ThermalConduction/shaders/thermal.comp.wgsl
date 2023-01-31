struct Grid {
    points : array<f32> // XY, X+1Y, X+2Y, ..., XY+1, X+1Y+1, ...
};
@group(0) @binding(0) var<storage, read> inGridRead : Grid;
@group(0) @binding(1) var<storage, read_write> inGridWrite : Grid;

struct GridData {
    size : vec2<f32>,
    deltat : f32,
    deltax : f32,
    deltay : f32
};
@group(0) @binding(2) var<uniform> inGridData : GridData;

struct PhysData {
    conductivity : f32,
    density : f32,
    capacity : f32
};
@group(0) @binding(3) var<uniform> inPhysData : PhysData;

struct PhysSources {
    sourcesCount : f32,
    sources : array<f32> // X1, Y1, SourceRadius1, SourceVal1, X2, Y2, SourceRadius2, SourceVal2, ...
};
@group(0) @binding(4) var<storage, read> inSourcesData : PhysSources;


@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    var coords = vec2<f32>(f32(global_id.x), f32(global_id.y));
    if (coords.x >= inGridData.size.x || coords.y >= inGridData.size.y) {
        return;
    }

    // If wall, do not update
    if (inGridRead.points[i32(coords.x + coords.y * inGridData.size.x)] == -1.0) {
        return;
    }

    // Update heat by running the algorithm
    inGridWrite.points[i32(coords.x + coords.y * inGridData.size.x)] = thermal(coords);
}



// ======== PHYSICS ========
// Update the node
fn thermal(coords : vec2<f32>) -> f32 {
    var fac = inPhysData.conductivity / inPhysData.density / inPhysData.capacity;
    // Apply heat equation
    var th = thermalAt(coords.x, coords.y)
           + fac * inGridData.deltat / inGridData.deltax / inGridData.deltax * (thermalAt(coords.x + 1, coords.y) - 2.0 * thermalAt(coords.x, coords.y) + thermalAt(coords.x - 1, coords.y))
           + fac * inGridData.deltat / inGridData.deltay / inGridData.deltay * (thermalAt(coords.x, coords.y + 1) - 2.0 * thermalAt(coords.x, coords.y) + thermalAt(coords.x, coords.y - 1));
    
    // Heat sources
    for (var i = 0; i <= i32(inSourcesData.sourcesCount); i++) {
        var pos = vec2<f32>(inSourcesData.sources[i * 4 + 0]*inGridData.size.x - coords.x, inSourcesData.sources[i * 4 + 1]*inGridData.size.y - coords.y);
        var dist2 = pos.x*pos.x + pos.y*pos.y;
        if (dist2*dist2 <= inSourcesData.sources[i * 4 + 2]*inSourcesData.sources[i * 4 + 2]) {
            th = th + inSourcesData.sources[i * 4 + 3] / inPhysData.capacity;
            break;
        }
    }
    return th;
}



// ======= UTILS ========
// Return the value of the node at given coordinates, handle edges using periodic conditions
fn thermalAt(x : f32, y : f32) -> f32 {
    var coordsAbs = vec2<f32>(x, y);
    // Check if x in range
    if (coordsAbs.x >= inGridData.size.x) { coordsAbs.x -= inGridData.size.x; }
    else if (coordsAbs.x < 0.0) { coordsAbs.x += inGridData.size.x; }

    // Check if y in range
    if (coordsAbs.y >= inGridData.size.y) { coordsAbs.y -= inGridData.size.y; }
    else if (coordsAbs.y < 0.0) { coordsAbs.y += inGridData.size.y; }

    // Treat -1 values as walls (= 0 heat)
    var v = inGridRead.points[i32(round(coordsAbs.x) + round(coordsAbs.y) * inGridData.size.x)];
    if (v == -1.0) {
        return 0.0;
    }
    return v;
}
