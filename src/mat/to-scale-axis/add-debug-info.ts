
declare var _debug_: Debug; 

import { Debug } from '../../debug/debug';
import { Mat    } from '../../mat';


/**
 * @hidden
 * @param sat 
 */
function addDebugInfo(sat: Mat, timingStart: number) {
	if (typeof _debug_ === 'undefined') { return; }

	_debug_.generated.elems.sat.push(sat);

	let timing = _debug_.generated.timing;
	timing.sats = performance.now() - timingStart;
}


export { addDebugInfo }
