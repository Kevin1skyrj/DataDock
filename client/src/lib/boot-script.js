import { ACCENT_IDS, ACCENT_STORAGE_KEY } from "@/constants/accents";
import { SIDEBAR_STORAGE_KEY } from "@/constants/dashboard";
import { DETAILS_STORAGE_KEY } from "@/constants/workspace";
import { ENTRANCE_STORAGE_KEY } from "@/lib/entrance";

/**
 * Runs synchronously during HTML parsing, before first paint. Three jobs, all of
 * which must happen before anything is drawn:
 *
 * 1. Apply the stored accent, so a purple user never sees a blue flash.
 * 2. Mark the document motion-ready. Entrance animations need their elements to
 *    start hidden, but hiding them in plain CSS would leave the page blank when
 *    JavaScript fails. Gating that initial state behind an attribute only a
 *    script can set means no-JS visitors get the fully composed page instead.
 * 3. Apply the stored sidebar width and details-panel state. Same argument as the accent, and louder:
 *    a sidebar that paints at 248px and jumps to 68px is 190px of visible
 *    correction on every single load of the application.
 *
 * The flag is withheld from anyone who asked for reduced motion, so their
 * content is never hidden even briefly.
 *
 * It tests `no-preference` rather than `not reduce` on purpose: that is the
 * exact query GSAP's matchMedia gates the entrance on. A browser that does not
 * support the feature matches neither, so testing the negation would set the
 * flag — hiding the content — while GSAP declined to run the animation that
 * brings it back. Asking the same question in both places cannot diverge.
 *
 * The flag is also withheld once the entrance has played this session. It has
 * to be decided here rather than in React: by the time a component could check,
 * the hidden initial state has already painted, and unhiding it would be a
 * visible flash on every repeat view.
 */
export const bootScript = `(function(){var d=document.documentElement;try{var a=localStorage.getItem("${ACCENT_STORAGE_KEY}");if(${JSON.stringify(
  ACCENT_IDS,
)}.indexOf(a)>-1){d.dataset.accent=a}}catch(e){}var s=false;try{s=sessionStorage.getItem(${JSON.stringify(
  ENTRANCE_STORAGE_KEY,
)})==="1"}catch(e){}try{if(!s&&matchMedia("(prefers-reduced-motion: no-preference)").matches){d.dataset.motion="ready"}}catch(e){}try{if(localStorage.getItem(${JSON.stringify(
  SIDEBAR_STORAGE_KEY,
)})==="1"){d.dataset.sidebar="collapsed"}}catch(e){}try{if(localStorage.getItem(${JSON.stringify(
  DETAILS_STORAGE_KEY,
)})==="1"){d.dataset.details="open"}}catch(e){}})();`;
