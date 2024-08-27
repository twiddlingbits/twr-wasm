// pre-installed libraries go in this file

import twrLibMathMod from "./twrlibmath.js";
import twrLibLocaleMod from "./twrliblocale.js"
import twrLibTimerMod from "./twrlibtimer.js"

import twrLibAudio from "./twrlibaudio.js";

// currently, libraries can only have one instance
let defaultLibsAreRegistered=false;

export async function twrLibBuiltIns() {
   if (!defaultLibsAreRegistered) {

      // add builtin libraries here:
       const twrLibMathInst=new twrLibMathMod;
       const twrLibLocaleInst=new twrLibLocaleMod;
       const twrLibTimerInst=new twrLibTimerMod;
       
       const twrLibAudioInst=new twrLibAudio;


      defaultLibsAreRegistered=true;
   }
}