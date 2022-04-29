// System constants
let pi : f32 = 3.141592653;
let Z : f32 = 1.0;


fn factorial(x : i32) -> i32 {
    if (x <= 0) { // Convention
        return 1;
    }

    var fac = 1;
    var i = 1;
    loop {
        if (i > x) {
            break;
        }
        fac = fac * i;
        i = i + 1;
    }
    return fac;
}

fn binomial(k : i32, n : i32) -> i32 {
    return factorial(n) / factorial(n - k) / factorial(k);
}

fn laguerreGeneralises(x : f32, n : i32, l : i32) -> f32 {
    var val = 0.0;
    var i = 0;
    loop {
        if (i > n) {
            break;
        }

        var sig = -1.0;
        if (i % 2 == 0) {
            sig = 1.0;
        }
        val = val + sig * f32(binomial(n-i, n+l)) * pow(x, f32(i)) / f32(factorial(i));
        i = i + 1;
    }
    return val;
}

fn Y(theta : f32, phi : f32, l : i32, m : i32) -> f32 {
    if (l == 0) {
        if (m == 0) {
            return 1.0 / sqrt(4.0 * pi);
        }
    }
    else if (l == 1) {
        if (m == 0) {
            return sqrt(3.0 / (4.0 * pi)) * cos(theta);
        }
        else if (m == 1) {
            return -sqrt(3.0 / (8.0 * pi)) * sin(theta) * cos(phi);
        }
    }
    else if (l == 2) {
        if (m == 0) {
            return sqrt(5.0 / (4.0 * pi)) * (3.0 * cos(theta)*cos(theta) - 1.0) / 2.0;
        }
        else if (m == 1) {
            return -sqrt(15.0 / (8.0 * pi)) * sin(theta) * cos(theta) * cos(phi);
        }
        else if (m == 2) {
            return 0.25 * sqrt(15.0 / (2.0 * pi)) * sin(theta) * sin(theta) * cos(2.0 * phi);
        }
    }
    else if (l == 3) {
        if (m == 0) {
            return sqrt(7.0 / (4.0 * pi)) * (5.0 * cos(theta)*cos(theta)*cos(theta)/2.0 - 3.0/2.0*cos(theta));
        }
        else if (m == 1) {
            return -0.25*sqrt(21.0 / (4.0 * pi)) * sin(theta) * (5.0*cos(theta)*cos(theta) - 1.0) * cos(phi);
        }
        else if (m == 2) {
            return 0.25 * sqrt(105.0 / (2.0 * pi)) * sin(theta) * sin(theta) * cos(theta) * cos(2.0 * phi);
        }
        else if (m == 3) {
            return -0.25 * sqrt(35.0 / (4.0 * pi)) * sin(theta) * sin(theta) * sin(theta) * cos(3.0 * phi);
        }
    }

    // else : Not implemented
    return 0.0;
}

fn R(r : f32, n : i32, l : i32) -> f32 {
    let normalizationFac = sqrt(
            pow(2.0/f32(n), 3.0)
        * f32(factorial(n - l - 1))
        / (2.0 * f32(n) * f32(factorial(n + l)))
    ) * 100.0;

    return normalizationFac
            * exp(-Z/f32(n) * r)
            * laguerreGeneralises(Z/f32(n) * r, n, l)
            * pow(Z/f32(n) * r, f32(l));
}


fn atomPsi(pos : vec2<f32>, n : i32, l : i32, m : i32) -> f32 {
    // Polar coordinates
    let phi = 0.0;
    let r = sqrt(pos.x * pos.x + pos.y * pos.y);
    var theta = acos(pos.y / r); // x > 0 => theta > 0
    if (pos.x < 0.0) { // x < 0 => theta < 0
        theta = theta * (-1.0);
    }

    // Hydrogen atom density probability
    return R(r, n, l) * Y(theta, phi, l, m);
}


fn probabilityColorAt(pos : vec2<f32>) -> vec3<f32> {
    // Constants
    let n = 3;
    let l = 2;
    let m = 1;
    let opacityFactor = 2.0;

    // Screen viewing boundaries
    //let xRange = vec2(-0.008, 0.008);
    //let yRange = vec2(-0.008, 0.008);
    let xRange = vec2(-20.0, 20.0);
    let yRange = vec2(-20.0, 20.0);

    // Convert coordinates to boundaries
    let iPos = vec2<f32>(
        pos.x * (xRange.y - xRange.x) + xRange.x,
        pos.y * (yRange.y - yRange.x) + yRange.x
    );

    let psi = atomPsi(iPos, n, l, m);

    var color = vec3<f32>(255.0, 201.0, 102.0) / 255.0;
    if (psi < 0.0) {
        color = vec3<f32>(105.0, 189.0, 218.0) / 255.0;
    }

    let proba = psi * psi;
    let opacity = min(1.0, max(0.0, proba));

    return color * opacity * opacityFactor;
}


@stage(fragment)
fn main(@location(0) inPos : vec2<f32>) -> @location(0) vec4<f32> {
    return vec4<f32>(probabilityColorAt(inPos), 1.0);
}
