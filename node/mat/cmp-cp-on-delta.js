"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cmpCpOnδ = void 0;
const contact_point_1 = require("../contact-point");
/**
 * @hidden
 * Note: For debugging only
 * Checks the position of the ContactPoint (cp) on the boundary piece.
 * Returns < 0 if the cp is not on δ, > 0 if it is on the boundary piece
 * excluding the endpoints and 0 if it is on the endpoints. Also returns > 0 if
 * δ === undefined.
 * @param δ The boundary piece
 * @param cp The contact point
 */
function cmpCpOnδ(δ, cp) {
    if (δ[0] === undefined) {
        return 1;
    }
    let cpBef = δ[0].cp;
    let cpAft = δ[1].cp;
    let cmp = contact_point_1.compareCps(cpBef, cpAft);
    let cmpPrev = contact_point_1.compareCps(cpBef, cp);
    let cmpNext = contact_point_1.compareCps(cp, cpAft);
    if (cmp < 0) {
        if (cmpPrev > 0 || cmpNext > 0) {
            console.log(`2-PRONG (antipode) Order is wrong - cmpPrev and cmpNext should be > 0; cmp: ${cmp}, cmpPrev: ${cmpPrev}, cmpNext ${cmpNext}`);
            //_debug_.fs.draw.dot(cp.pointOnShape.p, 1, "blue");
            return -1;
        }
    }
    else if (cmp > 0) {
        if (cmpPrev > 0 && cmpNext > 0) {
            console.log(`2-PRONG (antipode) Order is wrong: ${cmpPrev}, ${cmpNext}`);
            //_debug_.fs.draw.dot(cp.pointOnShape.p, 1, "blue");
            return -1;
        }
    }
    if (cmpPrev === 0 || cmpNext === 0) {
        console.log('2-PRONG orders are equal.');
        return 0;
    }
    return 1;
}
exports.cmpCpOnδ = cmpCpOnδ;
//# sourceMappingURL=cmp-cp-on-delta.js.map