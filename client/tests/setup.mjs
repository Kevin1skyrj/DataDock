import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./resolve-hook.mjs", pathToFileURL(`${import.meta.dirname}/`));
