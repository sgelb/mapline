import cheapruler from "cheap-ruler";

// Helper function to solve the linear system
function Quincunx(u, v, w, q) {
    u[0] = 0;
    v[1] /= u[1];
    w[1] /= u[1];

    for (let j = 2; j < u.length - 1; j++) {
        u[j] = u[j] - u[j - 2] * w[j - 2] * w[j - 2] - u[j - 1] * v[j - 1] * v[j - 1];
        v[j] = (v[j] - u[j - 1] * v[j - 1] * w[j - 1]) / u[j];
        w[j] /= u[j];
    }

    // forward substitution
    q[1] = q[1] - v[0] * q[0];
    for (let j = 2; j < u.length - 1; j++) {
        q[j] = q[j] - v[j - 1] * q[j - 1] - w[j - 2] * q[j - 2];
    }
    for (let j = 1; j < u.length - 1; j++) {
        q[j] /= u[j];
    }

    // back substitution
    q[u.length - 1] = 0;
    for (let j = u.length - 3; j > 0; j--) {
        q[j] = q[j] - v[j] * q[j + 1] - w[j] * q[j + 2];
    }
    q[u.length] = 0;

    return q;
}

// smooth the profile using the algorithm in "Smoothing Splines" by D.S.G. Pollock
// partially based on code from https://github.com/umontreal-simul/ssj
// but simplified as we do not care about interpolation between the points
function splineSmoother(profile, lambda) {
    let n = profile.length;

    let h = new Array(n);
    let r = new Array(n);
    let u = new Array(n);
    let v = new Array(n);
    let w = new Array(n);
    let q = new Array(n + 1);

    let mu = 2 * (1 - lambda) / (3 * lambda);

    // initialize some elements to avoid NaN
    h[0] = profile[1].distance - profile[0].distance;
    r[0] = 3 / h[0];
    q[0] = 0;
    u[0] = 0;
    v[0] = 0;
    w[0] = 0;

    for (let i = 1; i < n - 1; i++) {
        h[i] = profile[i + 1].distance - profile[i].distance;
        r[i] = 3 / h[i];
        q[i] = 3 * (profile[i + 1].elevation - profile[i].elevation) / h[i] - 3 * (profile[i].elevation - profile[i - 1].elevation) / h[i - 1];
    }

    for (let i = 1; i < n - 1; i++) {
        u[i] = r[i - 1] * r[i - 1] + (r[i - 1] + r[i]) * (r[i - 1] + r[i]) + r[i] * r[i];
        u[i] = mu * u[i] + 2 * (profile[i + 1].distance - profile[i - 1].distance);
        v[i] = -(r[i - 1] + r[i]) * r[i] - r[i] * (r[i] + r[i + 1]);
        v[i] = mu * v[i] + h[i];
        w[i] = mu * r[i] * r[i + 1];
    }

    // solve the system
    q = Quincunx(u, v, w, q);

    let result = [];

    let p0 = profile[0].elevation - mu * r[0] * q[1];
    let dd = profile[1].elevation - mu * ((-r[0] - r[1]) * q[1] + r[1] * q[2]);
    let p1 = (dd - p0) / h[0] - q[1] * h[0] / 3;
    result.push({ distance: profile[0].distance, elevation: p0, slope: p1 });

    for (let j = 1; j < n - 1; j++) {
        let p1 = (q[j] + q[j - 1]) * h[j - 1] + result[j - 1].slope;
        let p0 = r[j - 1] * q[j - 1] + (-r[j - 1] - r[j]) * q[j] + r[j] * q[j + 1];
        p0 = profile[j].elevation - mu * p0;
        result.push({ distance: profile[j].distance, elevation: p0, slope: p1 });
    }

    let j = n - 1;
    let p3 = (q[j] - q[j - 1]) / (3 * h[j - 1]);
    let p2 = q[j - 1];
    let hn = profile[n - 1].distance - profile[n - 2].distance;
    p1 = profile[n - 2].slope + hn * (2 * p2 + 3 * hn * p3);
    p0 = profile[n - 2].elevation + hn * (profile[n - 2].slope + hn * (p2 + hn * p3))
    result.push({ distance: profile[j].distance, elevation: p0, slope: p1 });

    return result;
}

// find segments of an array for whose a predicate is true
// returns pairs of start, end indices for use with slice() i.e. end is outside the segment
function getSlopeSegments(array) {
    let segments = [];
    let segment = { start: 0 };

    for (let i = 1; i < array.length; i++) {
        if (array[i - 1].slope * array.slope < 0.0) {
            segment.end = i;
            segments.push(segment)
            segment = { start: i };
        }
    }

    segment.end = array.length;
    segments.push(segment);
    return segments;
}

// find segments of an array for whose a predicate is true
// returns pairs of start, end indices for use with slice() i.e. end is outside the segment
function getSegments(array, pred) {
    let isSegment = false;
    let segments = [];
    var segment;
    for (let i = 0; i < array.length; i++) {
        if (!isSegment && pred(array[i])) {
            segment = { start: i };
            isSegment = true;
        }
        else if (isSegment && !pred(array[i])) {
            segment.end = i;
            segments.push(segment);
            isSegment = false;
        }
    }
    if (isSegment) {
        segment.end = array.length;
        segments.push(segment);
    }
    return segments;
}

function mergeSegments(profile, segments) {
    const maxDistance = 500;

    let result = [];
    if (segments.length <= 1) {
        return segments;
    }

    let lastSegment = undefined;

    for (let currentSegment of segments) {
        if (lastSegment !== undefined) {
            // get the last point of the previous segment and the first point of the current one
            let endLast = profile[lastSegment.end];
            let startCurrent = profile[currentSegment.start];

            // merge if there is no change in direction and the points are close enough
            if (endLast.slope * startCurrent.slope > 0 && startCurrent.distance - endLast.distance <= maxDistance) {
                // merge with the last segment
                currentSegment.start = lastSegment.start;
            } else {
                // keep the last segment as-is
                result.push(lastSegment);
            }
        }
        lastSegment = currentSegment;
    }

    // don't forget the last segment
    result.push(lastSegment);

    return result;
}

// determine if a profile is relevant and should be shown
function isRelevant(profile) {
    let length = profile[profile.length - 1].distance - profile[0].distance;
    if (length == 0.0) {
        return false;
    }

    let deltaEle = (profile[profile.length - 1].elevation - profile[0].elevation);

    // the criterion is the elevation change
    return Math.abs(deltaEle) > 10;
}

// get the elevation profile for a track line
function elevationProfile(line) {
    const ruler = cheapruler(line[Math.trunc(line.length / 2)][1], "meters");

    // start with computing the distances along the track
    let profile = [];
    {
        let distance = 0;
        let previousPoint = line[0];
        for (let i = 0; i < line.length; i++) {
            let currentPoint = line[i];
            distance += ruler.distance(previousPoint, currentPoint);
            profile.push({ distance: distance, elevation: currentPoint[2] });
            previousPoint = line[i];
        }
    }

    return profile;
}

function addSlope(profile) {
    const slopeDistance = 25;

    // compute the slope over a given distance, not point by point
    for (let i = 0; i < profile.length; i++) {
        let elevation1 = profile[i].elevation;
        let elevation2 = profile[i].elevation;

        let distance = 0;
        let currentDistance = profile[i].distance;

        let j = 0;
        let k = 0;

        for (j = i; j > 0; j--) {
            let pointDistance = currentDistance - profile[j].distance;
            if (pointDistance >= slopeDistance) {
                elevation1 = profile[j].elevation;
                distance += pointDistance;
                break;
            }
        }

        for (k = i; k < profile.length; k++) {
            let pointDistance = profile[k].distance - currentDistance;
            if (pointDistance >= slopeDistance) {
                elevation2 = profile[k].elevation;
                distance += pointDistance;
                break;
            }
        }

        profile[i].slope = (elevation2 - elevation1) / distance; // 100 to convert into percent
    }
}

function slopeSections(profile, minimumSlope) {
    let result = [];

    let segments = getSegments(profile, (p => { return Math.abs(p.slope) >= minimumSlope; }));

    for (const segment of segments) {
        let segmentProfile = profile.slice(segment.start, segment.end);
        if (!isRelevant(segmentProfile)) {
            continue;
        }

        // get the maximum absolute slope but preserve the sign
        // first get the maximum and minimum values
        let segmentSlopes = segmentProfile.map(p => { return p.slope; });
        let maxSlope = segmentSlopes.reduce((a, b) => { return Math.max(a, b); });
        let minSlope = segmentSlopes.reduce((a, b) => { return Math.min(a, b); });

        // now correct if the minimum has the larger absolute value
        if (Math.abs(minSlope) > Math.abs(maxSlope)) {
            maxSlope = minSlope;
        }

        segment.slope = maxSlope;
        result.push(segment);
    }
    return result;
}

const profile = {
    slopes(line, lambda, minimumSlope) {
        // compute the elevation profile including slopes
        let profile = elevationProfile(line);

        if (lambda < 1) {
            // smooth the profile
            profile = splineSmoother(profile, lambda);
        } else {
            // compute the slope from the profile
            addSlope(profile);
        }

        // find the section with significant slope
        let slopeSegments = slopeSections(profile, minimumSlope);

        return slopeSegments;
    }
};

export default profile;