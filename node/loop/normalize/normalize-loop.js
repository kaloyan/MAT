"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const loop_1 = require("../loop");
const get_max_coordinate_1 = require("./get-max-coordinate");
const fix_beziers_1 = require("./fix-beziers");
const flo_bezier3_1 = require("flo-bezier3");
const sweep_line_1 = require("../../sweep-line/sweep-line");
const in_same_k_family_and_maybe_intersecting_1 = require("./in-same-k-family-and-maybe-intersecting");
/**
 * Returns loops that is the result of putting the given loops in general
 * position (loosely speaking). The modifications to the input loop should be
 * such that no discernable visual changes occur.
 *
 * The following guarantees are put in place for the returned loops:
 * * No bezier is of zero length.
 * * All points are coerced onto a grid. In other words, such that the
 * significand of all points are reduced to a specified number of bits and the
 * significant bits of all points overlap.
 * * All bezier points of a single curve are seperated - this prevents infinite
 * curvature at the endpoints, etc.
 * * TODO - All curves are x-monotone (i.e. the x-coordinate of any bezier curve is a
 * (non-strict) increasing (or decreasing) function of its parameter)
 * * TODO - All curves are y-monotone (i.e. the y-coordinate of any bezier curve is a
 * (non-strict) increasing (or decreasing) function of its parameter)
 * * TODO - No two bezier curves are in the same K-family (i.e. the same curve when the
 * parameter can vary in [-inf, +inf]) unless they are non-intersecting.
 * * TODO - no bezier cusps
 * * TODO - no bezier self-intersections (including single bezier closed loops)
 * * TODO !!IMPORTANT!! No self-intersections at infinitely many points, i.e.
 * where the curve goes back on itself.
 *
 * This gives us some good guarantees for the rest of the algorithm. In
 * particular, the algorithms is made much less complex and runs much faster.
 *
 * @param loop
 * @param maxCoordinate
 */
function normalizeLoops(bezierLoops, maxBitLength) {
    let maxCoordinate = get_max_coordinate_1.getMaxCoordinate(bezierLoops);
    /** The exponent, e, such that 2^e >= all bezier coordinate points. */
    let expMax = Math.ceil(Math.log2(maxCoordinate));
    let gridSpacing = Math.pow(2, expMax) * Math.pow(2, (-maxBitLength));
    let fixBeziers_ = fix_beziers_1.fixBeziers(expMax, maxBitLength);
    let loops = bezierLoops.slice();
    let seed = SEED;
    let maxTries = 10;
    let i = 0;
    while (true) {
        if (++i >= maxTries) {
            throw new Error('max tries exceeded');
        }
        loops = loops.map(fixBeziers_);
        // Check if any two beziers are in the same K-family and are not seperated
        // Otherwise move a coordinate in some direction by a small amount and
        // retest and re-align to grid.
        let pss = [];
        loops.forEach(function (loop) {
            loop.forEach((ps, idx) => {
                pss.push({ ps, loop, idx });
            });
        });
        let pairs = sweep_line_1.sweepLine(pss, ps => getLeftmost(ps.ps), ps => getRightmost(ps.ps), (ps1, ps2) => in_same_k_family_and_maybe_intersecting_1.inSameKFamliyAndMaybeIntersecting(ps1.ps, ps2.ps));
        if (!pairs.length) {
            break;
        }
        console.log(pairs);
        for (let pair of pairs) {
            //console.log(pair);
            // Randomly choose one of the 2 beziers
            let v;
            ({ v, seed } = randomInt(seed, 1));
            let ps_ = v === 0 ? pair[0] : pair[1];
            let ps = ps_.ps;
            // Choose a random point of the bezier
            ({ v, seed } = randomInt(seed, ps.length - 1));
            // Move that point by an amount gridSpacing in a random direction
            let newPs = ps.map((p, i) => {
                let p_;
                if (i !== v) {
                    return p;
                } // Leave p unchanged
                ({ p: p_, seed } = movePointInRandomDirection(p, seed, gridSpacing));
                return p_;
            });
            let { idx, loop } = ps_;
            // Splice in the new bezier
            loop.splice(idx, 1, newPs);
            // If first endpoints moved, also move prev/next beziers' endpoints
            let prevIdx = idx === 0 ? loop.length - 1 : idx - 1;
            let nextIdx = (idx + 1) % loop.length;
            let prevPs = loop[prevIdx];
            let nextPs = loop[nextIdx];
            loop.splice(prevIdx, 1, replacePoint(prevPs, newPs[0], prevPs.length - 1));
            loop.splice(nextIdx, 1, replacePoint(nextPs, newPs[newPs.length - 1], 0));
        }
    }
    return loops.map(loop => new loop_1.Loop(loop));
}
exports.normalizeLoops = normalizeLoops;
/**
 * Returns a new point by moving the previous point in a predictably random
 * direction
 * @param p A point
 */
function movePointInRandomDirection(p, seed_, gridSpacing) {
    let { v, seed } = randomInt(seed_, 3);
    let p_;
    if (v === 0) {
        // Move up
        p_ = [p[0], p[1] - gridSpacing];
    }
    else if (v === 1) {
        // Move down
        p_ = [p[0], p[1] + gridSpacing];
    }
    else if (v === 2) {
        // Move left
        p_ = [p[0] - gridSpacing, p[1]];
    }
    else {
        // Move right
        p_ = [p[0] + gridSpacing, p[1]];
    }
    return { p: p_, seed };
}
function replacePoint(ps, p, idx) {
    return ps.map((p_, i) => i === idx ? p : p_);
}
/**
 * Returns a random number from 0 to upTo
 * @param v A number in [0,1)
 */
function randomInt(seed, upTo) {
    seed = predictiveRandom(seed);
    let v = Math.floor((seed / RANGE) * (upTo + 1));
    return { v, seed };
}
/**
 * Some seed value for the simple random number generator.
 * @ignore
 */
const SEED = 123456789;
/**
 * The range for the simple random number generator, i.e. the generated
 * numbers will be in [0,RANGE].
 * @ignore
 */
const RANGE = 4294967296;
/**
 * Returns a quasi-random number to be used as the next input to this function.
 * See https://stackoverflow.com/a/3062783
 * @private
 * @param seed
 */
function predictiveRandom(seed = SEED) {
    const a = 134775813;
    return (a * seed + 1) % RANGE;
}
function getLeftmost(ps) {
    let bounds = flo_bezier3_1.getBounds(ps);
    return bounds.box[0][0];
}
function getRightmost(ps) {
    let bounds = flo_bezier3_1.getBounds(ps);
    return bounds.box[1][0];
}
//# sourceMappingURL=normalize-loop.js.map