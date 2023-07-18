import {
  getKernelLoaded,
  getLoginComplete,
  getLogoutComplete,
} from "./vars.js";
import { objAsString } from "@lumeweb/libweb";

export function sendAuthUpdate() {
  window.parent.postMessage(
    {
      method: "kernelAuthStatus",
      data: {
        loginComplete: getLoginComplete(),
        kernelLoaded: getKernelLoaded(),
        logoutComplete: getLogoutComplete(),
      },
    },
    "*",
  );
}

function bootloaderWLog(isErr: boolean, ...inputs: any) {
  // Build the message, each item gets its own line. We do this because items
  // are often full objects.
  let message = "[lumeweb-kernel-bootloader]";
  for (let i = 0; i < inputs.length; i++) {
    message += "\n";
    message += objAsString(inputs[i]);
  }

  // Create the log by sending it to the parent.
  window.parent.postMessage(
    {
      method: "log",
      data: {
        isErr,
        message,
      },
    },
    "*",
  );
}

export function log(...inputs: any) {
  bootloaderWLog(false, ...inputs);
}
export function logErr(...inputs: any) {
  bootloaderWLog(true, ...inputs);
}

export function reloadKernel() {
  window.location.reload();
}
