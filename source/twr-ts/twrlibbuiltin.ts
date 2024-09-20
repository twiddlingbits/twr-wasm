// pre-installed libraries go in this file

import {twrLibraryInstanceRegistry} from "./twrlibrary"

import twrLibMathMod from "./twrlibmath.js";
import twrLibLocaleMod from "./twrliblocale.js"
import twrLibTimerMod from "./twrlibtimer.js"

import twrLibAudio from "./twrlibaudio.js";
import twrLibDateMod from "./twrlibdate.js"
import twrConsoleDummy from "./twrcondummy.js"

// currently, libraries can only have one instance
let defaultLibsAreRegistered=false;

export async function twrLibBuiltIns() {
   if (!defaultLibsAreRegistered) {

      // add builtin libraries here:
      new twrLibMathMod;  // will register self in twrLibraryInstanceRegistry
      new twrLibLocaleMod;
      new twrLibTimerMod;
      new twrLibAudio;
      new twrLibDateMod;
      new twrConsoleDummy;

      defaultLibsAreRegistered=true;
   }
}
