struct Grid {
    points : array<f32> // XY, X+1Y, X+2Y, ..., XY+1, X+1Y+1, ...
};
@group(0) @binding(0) var<storage, read_write> inGridBuff0 : Grid;
@group(0) @binding(1) var<storage, read_write> inGridBuff1 : Grid;

struct GridData {
    size : vec2<f32>,
    deltat : f32,
    deltax : f32,
    deltay : f32
};
@group(0) @binding(2) var<uniform> inGridData : GridData;

struct PhysSources {
    wallsDrawRadius : u32,
    wallsCount : u32,
    walls : array<u32> // X1, Y1, Dt1, X2, Y2, Dt2, ...
};
@group(0) @binding(3) var<storage, read> inSourcesData : PhysSources;


@stage(compute) @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    if (global_id.x >= inSourcesData.wallsCount) {
        return;
    }

    // Config
    var linearIterator = 1;
    var maxDeltaTime   = 1000;

    // Linear interpolate
    if (inSourcesData.walls[global_id.x * 3 + 2] - inSourcesData.walls[(global_id.x - 1) * 3 + 2] < u32(maxDeltaTime) && global_id.x > 0) {
        var oldX = i32(inSourcesData.walls[(global_id.x - 1) * 3 + 0]);
        var oldY = i32(inSourcesData.walls[(global_id.x - 1) * 3 + 1]);

        var newX = i32(inSourcesData.walls[global_id.x * 3 + 0]);
        var newY = i32(inSourcesData.walls[global_id.x * 3 + 1]);

        if (newX > oldX) {
            for (var i = oldX; i <= newX; i += linearIterator) {
                if (newY > oldY) {
                    for (var j = oldY; j <= newY; j += linearIterator) {
                        circleAround(i + j * i32(inGridData.size.x));
                    }
                }
                else {
                    for (var j = newY; j <= oldY; j += linearIterator) {
                        circleAround(i + j * i32(inGridData.size.x));
                    }  
                }
            }
        }
        else {
            for (var i = newX; i <= oldX; i += linearIterator) {
                if (newY > oldY) {
                    for (var j = oldY; j <= newY; j += linearIterator) {
                        circleAround(i + j * i32(inGridData.size.x));
                    }
                }
                else {
                    for (var j = newY; j <= oldY; j += linearIterator) {
                        circleAround(i + j * i32(inGridData.size.x));
                    }  
                }
            }
        }
    }
    else {
        var x = i32(inSourcesData.walls[global_id.x * 3 + 0]);
        var y = i32(inSourcesData.walls[global_id.x * 3 + 1]);
        circleAround(x + y * i32(inGridData.size.x));
    }
}

fn circleAround(index : i32) {
    // Wall circle
    var circleThreshold = 0.7;
    for (var i = -i32(inSourcesData.wallsDrawRadius); i <= i32(inSourcesData.wallsDrawRadius); i++) {
        for (var j = -i32(inSourcesData.wallsDrawRadius); j <= i32(inSourcesData.wallsDrawRadius); j++) {
            let dist2 = sqrt(f32(i*i + j*j));

            // Outside of radius
            if (dist2 > f32(inSourcesData.wallsDrawRadius)) {
                continue;
            }

            if (dist2 < circleThreshold * f32(inSourcesData.wallsDrawRadius)) {
                // Add wall
                inGridBuff0.points[index + i + j * i32(inGridData.size.x)] = -1.0;
                inGridBuff1.points[index + i + j * i32(inGridData.size.x)] = -1.0;
            }
        }
    }
}
