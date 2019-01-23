import mapboxgl from "mapbox-gl";
import cheapruler from "cheap-ruler";

// find segments of an array for whose a predicate is true
// returns pairs of start, end indices for use with slice() i.e. end is outside the segment
function getSegments(array, pred) {
    let start = 0;
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

// determine the average slope over a profile
function averageSlope(profile) {
    let slopes = profile.map(p => { return Math.abs(p.slope); });
    let sum = slopes.reduce((a, b) => a + b);
    let length = profile.length;
    return length > 0.0 ? sum / length : 0;
}

// determine if a profile is relevant and should be shown
function isRelevant(profile) {
    let length = profile[profile.length - 1].distance - profile[0].distance;
    if (length == 0.0) {
        return false;
    }

    // get the change in elevation and the average slope
    let deltaEle = (profile[profile.length - 1].elevation - profile[0].elevation);
    let avgSlope = averageSlope(profile);

    // the criterion is the product of elevation change and slope
    // this is used to show short, steep gradients but not less steep ones with the same change in elevation
    return Math.abs(deltaEle * avgSlope) > 25;
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

    // compute the slope over a given distance, not point by point
    for (let i = 0; i < line.length; i++) {
        let elevation1 = line[i][2];
        let elevation2 = line[i][2];

        let distance = 0;
        let currentDistance = profile[i].distance;

        let j = 0;
        let k = 0;

        for (j = i; j > 0; j--) {
            let pointDistance = currentDistance - profile[j].distance;
            if (pointDistance >= 25) {
                elevation1 = line[j][2];
                distance += pointDistance;
                break;
            }
        }

        for (k = i; k < line.length; k++) {
            let pointDistance = profile[k].distance - currentDistance;
            if (pointDistance >= 25) {
                elevation2 = line[k][2];
                distance += pointDistance;
                break;
            }
        }

        profile[i].slope = 100 * (elevation2 - elevation1) / distance; // 100 to convert into percent
    }

    return profile;
}

function slopeSections(profile) {
    let result = [];

    let segments = getSegments(profile, (p => { return Math.abs(p.slope) >= 5.0; }));
    for (const segment of segments) {
        let segmentProfile = profile.slice(segment.start, segment.end);
        if (!isRelevant(segmentProfile)) {
            continue;
        }
        let maxSlope = segmentProfile.map(p => { return Math.abs(p.slope); }).reduce((a, b) => { return Math.max(a, b); });

        if (maxSlope < 10.0) {
            segment.slope = 5.0 * Math.sign(segmentProfile[0].slope);
            result.push(segment);
        } else {
            let steepSegments = getSegments(segmentProfile, (p => { return Math.abs(p.slope) >= 10.0; }));
            let segmentStart = segment.start;
            for (const steepSegment of steepSegments) {
                let steepProfile = segmentProfile.slice(steepSegment.start, steepSegment.end);
                if (!isRelevant(steepProfile)) {
                    continue;
                }
                if (steepSegment.start > 0) {
                    if (isRelevant(segmentProfile.slice(0, steepSegment.start))) {
                        // add the leading less steep part
                        result.push({ start: segmentStart, end: steepSegment.start + segment.start, slope: 5.0 * Math.sign(segmentProfile[0].slope) });
                    }
                }
                // add the steep part
                result.push({ start: steepSegment.start + segment.start, end: steepSegment.end + segment.start, slope: 10.0 * Math.sign(segmentProfile[0].slope) });
                segmentStart = steepSegment.end + segment.start;
            }
            if (segmentStart > 0 && segmentStart < segment.end) {
                if (isRelevant(segmentProfile.slice(segmentStart - segment.start))) {
                    // add the trailing less steep part
                    result.push({ start: segmentStart, end: segment.end, slope: 5.0 * Math.sign(segmentProfile[0].slope) });
                }
            }
        }
    }
    return result;
}

const profile = {
    slopes(line) {
        // compute the elevation profile including slopes
        let profile = elevationProfile(line);

        // find the section with significant slope
        let slopeSegments = slopeSections(profile);

        return slopeSegments;
    }
};

export default profile;