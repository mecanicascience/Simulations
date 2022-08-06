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
    walls : array<u32> // Index1, Index2, ...
};
@group(0) @binding(3) var<storage, read> inSourcesData : PhysSources;


@stage(compute) @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    if (global_id.x >= inSourcesData.wallsCount) {
        return;
    }

    // Wall circle
    for (var i = -i32(inSourcesData.wallsDrawRadius); i <= i32(inSourcesData.wallsDrawRadius); i++) {
        for (var j = -i32(inSourcesData.wallsDrawRadius); j <= i32(inSourcesData.wallsDrawRadius); j++) {
            let dist2 = i*i + j*j;
            if (dist2 <= i32(inSourcesData.wallsDrawRadius*inSourcesData.wallsDrawRadius)) {
                // Add wall
                inGridBuff0.points[i32(inSourcesData.walls[global_id.x]) + i + j * i32(inGridData.size.x)] = -1.0;
                inGridBuff1.points[i32(inSourcesData.walls[global_id.x]) + i + j * i32(inGridData.size.x)] = -1.0;
            }
        }
    }
}
