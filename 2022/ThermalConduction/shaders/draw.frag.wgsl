struct Grid {
    points : array<f32>
};
@group(0) @binding(0) var<storage, read> inGrid : Grid;

struct GridData {
    size : vec2<f32>,
    deltat : f32,
    deltax : f32,
    deltay : f32
};
@group(0) @binding(1) var<uniform> inGridData : GridData;

struct PhysData {
    conductivity : f32,
    density : f32,
    capacity : f32
};
@group(0) @binding(2) var<uniform> inPhysData : PhysData;

struct GridColor {
    colorsCount: f32,
    colors: array<f32> // As R1, G1, B1, R2, G2, B2, ...
};
@group(0) @binding(3) var<storage, read> inColors : GridColor;


@fragment
fn main(@location(0) inUv : vec2<f32>) -> @location(0) vec4<f32> {
    // Coords
    var coords = vec2<f32>(floor(inUv.x * inGridData.size.x), floor(inUv.y * inGridData.size.y));
    var val = inGrid.points[i32(coords.x + coords.y * inGridData.size.x)];

    // Wall = gray
    if (val == -1.0) {
        return vec4<f32>(0.3, 0.3, 0.3, 1.0);
    }

    // Normalize and compute color
    var col = computeColor(val);
    return vec4<f32>(col.r, col.g, col.b, 1.0);
}

// Compute pixel color (value normalized)
// http://www.andrewnoske.com/wiki/Code_-_heatmaps_and_color_gradients
fn computeColor(t : f32) -> vec3<f32> {
    // Desired color interpolated between these two indexes
    var colorsCount = i32(inColors.colorsCount);
    var idx1 = 0;
    var idx2 = 0;
    var fractBetween = 0.0;  // Fraction between idx1 and idx2 where our value is.
  
    // Compute color indices
    var value = t;
    if (value <= 0) { idx1 = 0; idx2 = 0; } // Accounts for an input <= 0
    else if (value >= 1)  {  idx1 = colorsCount - 1; idx2 = colorsCount - 1; } // Accounts for an input >= 0
    else {
        value = value * (f32(colorsCount) - 1.0);
        idx1  = i32(floor(value));
        idx2  = idx1 + 1;
        fractBetween = value - f32(idx1);
    }
    
    // Compute color
    var r = (inColors.colors[idx2 * 3 + 0] - inColors.colors[idx1 * 3 + 0]) * fractBetween + inColors.colors[idx1 * 3 + 0];
    var g = (inColors.colors[idx2 * 3 + 1] - inColors.colors[idx1 * 3 + 1]) * fractBetween + inColors.colors[idx1 * 3 + 1];
    var b = (inColors.colors[idx2 * 3 + 2] - inColors.colors[idx1 * 3 + 2]) * fractBetween + inColors.colors[idx1 * 3 + 2];
    return vec3<f32>(r, g, b);
}
