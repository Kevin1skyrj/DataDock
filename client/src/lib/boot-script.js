import { ACCENT_IDS, ACCENT_STORAGE_KEY } from "@/constants/accents";

/**
 * Runs synchronously during HTML parsing, before first paint. Two jobs, both of
 * which must happen before anything is drawn:
 *
 * 1. Apply the stored accent, so a purple user never sees a blue flash.
 * 2. Mark the document motion-ready. Entrance animations need their elements to
 *    start hidden, but hiding them in plain CSS would leave the page blank when
 *    JavaScript fails. Gating that initial state behind an attribute only a
 *    script can set means no-JS visitors get the fully composed page instead.
 *
 * The flag is withheld from anyone who asked for reduced motion, so their
 * content is never hidden even briefly.
 */
export const bootScript = `(function(){var d=document.documentElement;try{var a=localStorage.getItem("${ACCENT_STORAGE_KEY}");if(${JSON.stringify(
  ACCENT_IDS,
)}.indexOf(a)>-1){d.dataset.accent=a}}catch(e){}try{if(!matchMedia("(prefers-reduced-motion: reduce)").matches){d.dataset.motion="ready"}}catch(e){}})();`;
