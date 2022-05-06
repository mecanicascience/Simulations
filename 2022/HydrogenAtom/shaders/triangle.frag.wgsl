// Simulation buffer


// System constants
let pi : f32 = 3.141592653;


// Global methods
fn factorial(x : i32) -> i32 {
    // Convention
    if (x <= 0) {
        return 1;
    }

    // First factorials are known
    if (x == 1) {
        return 1;
    }
    else if (x == 2) {
        return 2;
    }
    else if (x == 3) {
        return 6;
    }
    else if (x == 4) {
        return 24;
    }
    else if (x == 5) {
        return 120;
    }
    else if (x == 6) {
        return 720;
    }

    // Compute factorial
    var fac = 1;
    for(var i: i32 = 2; i <= x; i++) {
        fac = fac * i;
    }
    return fac;
}


// YLM
fn associatedLegendre(theta : f32, l : i32, m : i32) -> f32 {
    let cosTheta = cos(theta);
    let sinTheta = sin(theta);
    if (l == 0) {
        if (m == 0) {
            return 1.0;
        }
    }
    else if (l == 1) {
        if (m == 0) {
            return cosTheta;
        }
        else if (m == 1) {
            return -sinTheta;
        }
    }
    else if (l == 2) {
        if (m == 0) {
            return 0.5 * (3.0 * cosTheta * cosTheta - 1.0);
        }
        else if (m == 1) {
            return -3.0 * cosTheta * sinTheta;
        }
        else if (m == 2) {
            return 3.0 * sinTheta * sinTheta;
        }
    }
    else if (l == 3) {
        if (m == 0) {
            return 0.5 * (5.0 * cosTheta * cosTheta * cosTheta - 3.0 * cosTheta);
        }
        else if (m == 1) {
            return -3.0 / 2.0 * (5.0 * cosTheta * cosTheta - 1.0) * sinTheta;
        }
        else if (m == 2) {
            return 15.0 * cosTheta * sinTheta * sinTheta;
        }
        else if (m == 3) {
            return -15.0 * sinTheta * sinTheta * sinTheta;
        }
    }
    else if (l == 4) {
        if (m == 0) {
            return 1.0 / 8.0 * (35.0 * cosTheta * cosTheta * cosTheta * cosTheta - 30.0 * cosTheta * cosTheta + 3.0);
        }
        else if (m == 1) {
            return -5.0 / 2.0 * (7.0 * cosTheta * cosTheta * cosTheta - 3.0 * cosTheta) * sinTheta;
        }
        else if (m == 2) {
            return 15.0 / 2.0 * (7.0 * cosTheta * cosTheta - 1.0) * sinTheta * sinTheta;
        }
        else if (m == 3) {
            return -105.0 * cosTheta * sinTheta * sinTheta * sinTheta;
        }
        else if (m == 4) {
            return 105.0 * sinTheta * sinTheta * sinTheta * sinTheta;
        }
    }

    // Not implemented
    return 0.0;
}

fn Y(theta : f32, phi : f32, l : i32, m : i32) -> f32 {
    // Sign
    var sign = -1.0;
    if (m % 2 == 0) {
        sign = 1.0;
    }

    // Normalization
    let normalizationFac = sqrt(
        f32(2*l + 1)
        * f32(factorial(l - abs(m)))
        / (4.0 * pi)
        / f32(factorial(l + abs(m))));

    // Phi contribution
    var phiContrib = 1.0;
    if (m < 0) {
        phiContrib = sin(f32(abs(m)) * phi);
    }
    else { // m >= 0
        phiContrib = cos(f32(m) * phi);
    }

    // Result
    return sign * normalizationFac * associatedLegendre(theta, l, abs(m)) * phiContrib;
}



// RNL
fn laguerreGeneralises(x : f32, n : i32, l : i32) -> f32 {
    var val = 0.0;

    for(var i: i32 = 0; i <= n - l - 1; i++) {
        var sign = -1.0;
        if (i % 2 == 0) {
            sign = 1.0;
        }
        val = val + sign
            * pow(f32(factorial(n + l)), 2.0)
            * pow(x, f32(i))
            / f32(factorial(i))
            / f32(factorial(n - l - 1 - i))
            / f32(factorial(2*l + 1 + i));
    }
    return val;
}

fn R(r : f32, n : i32, l : i32, Z : f32) -> f32 {
    let normalizationFac = sqrt(
          pow(2.0 * Z / f32(n), 3.0)
        * f32(factorial(n - l - 1))
        / (2.0 * f32(n) * pow(f32(factorial(n + l)), 3.0))
    );

    return normalizationFac
            * exp(-Z/f32(n) * r)
            * laguerreGeneralises(Z/f32(n) * r, n, l)
            * pow(2.0 * Z/f32(n) * r, f32(l));
}



// WAVE FUNCTION
// At (x, y, z)
fn atomPsi(pos : vec3<f32>, n : i32, l : i32, m : i32, Z : f32) -> f32 {
    // Polar coordinates
    let r = sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
    let theta = atan2(pos.z, r);
    let phi = atan2(pos.y, pos.x);

    // Hydrogen atom density probability
    return R(r, n, l, Z) * Y(theta, phi, l, m);
}


fn probabilityColorAt(pos : vec2<f32>) -> vec3<f32> {
    // Constants
    let n = 2;
    let l = 1;
    let m = 1;
    let opacityFactor = 500.0;
    let Z = 1.0;

    // Screen viewing boundaries
    let xRange = vec2(-20.0, 20.0);
    let yRange = vec2(-20.0, 20.0);

    // Compute point position based on camera (TODO)
    let iPos = vec3<f32>(
        pos.x * (xRange.y - xRange.x) + xRange.x,
        0.0,
        pos.y * (yRange.y - yRange.x) + yRange.x
    );

    // Compute vector to center
    let vecToCenter = vec3<f32>(0.0, 1.0, 0.0);

    // Number of planes to compute the wavefunction sum
    let RES_PLANE_COUNTS = 100;
    // Area to sum over each wavefunction
    let RES_PLANE_AREA = 10;

    // Sum over each planes
    var proba = 0.0;
    var color = vec3<f32>(0.0, 0.0, 0.0);
    for (var i: i32 = 0; i < RES_PLANE_COUNTS; i++) {
        // Pos
        let relPos = iPos + vecToCenter * sqrt(iPos.x*iPos.x + iPos.y*iPos.y + iPos.z*iPos.z) // shift to center
                    + vecToCenter * (f32(i) / f32(RES_PLANE_COUNTS) * f32(RES_PLANE_AREA * 2) - f32(RES_PLANE_AREA));

        // Wave function
        let psi = atomPsi(relPos, n, l, m, Z);
        var colorLoc = vec3<f32>(255.0, 201.0, 102.0) / 255.0;
        if (psi < 0.0) {
            colorLoc = vec3<f32>(105.0, 189.0, 218.0) / 255.0;
        }
        color += colorLoc;
        proba += psi * psi;
    }
    
    let opacity = min(1.0, max(0.0, proba / f32(RES_PLANE_COUNTS)));
    return color / f32(RES_PLANE_COUNTS) * opacity * opacityFactor;
}


@stage(fragment)
fn main(@location(0) inPos : vec2<f32>) -> @location(0) vec4<f32> {
    return vec4<f32>(probabilityColorAt(inPos), 1.0);
}
