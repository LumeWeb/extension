import ContentFilterRegistry from "../contentFilterRegistry.js";
import Csp from "./csp.js";

ContentFilterRegistry.registerFilter(new Csp());
