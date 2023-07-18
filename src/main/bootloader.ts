import { boot } from "./bootloader/kernel.js";
import { handleIncomingMessage } from "./bootloader/messages.js";

declare var browser: any; // tsc

document.title = "kernel.lume";
let header = document.createElement("h1");
header.textContent =
  "Something went wrong! You should not be visiting this page, this page should only be accessed via an invisible iframe.";
document.body.appendChild(header);

window.addEventListener("message", handleIncomingMessage);

boot();
