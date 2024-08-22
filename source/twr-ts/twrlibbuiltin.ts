// pre-installed libraries go in this file

import twrLibMathMod from "./twrlibmath.js";
import twrLibLocaleMod from "./twrliblocale.js"
import twrLibTimerMod from "./twrlibtimer.js"

// currently, libraries can only have one instance
let defaultLibsAreRegistered=false;

export async function twrLibBuiltIns() {
   if (!defaultLibsAreRegistered) {

      // add builtin libraries here:
       const twrLibMathInst=new twrLibMathMod;
       const twrLibLocaleInst=new twrLibLocaleMod;
       const twrLibTimerInst=new twrLibTimerMod;


      defaultLibsAreRegistered=true;
   }
}