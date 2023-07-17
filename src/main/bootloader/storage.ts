import { addContextToErr, hexToBuf } from "@lumeweb/libweb";
import {
  getLoginComplete,
  getLogoutComplete,
  setLoginComplete,
  setLogoutComplete,
  setUserKey,
} from "./vars.js";
import { log, logErr, reloadKernel, sendAuthUpdate } from "./util.js";
import { loadKernel } from "./kernel.js";

function handleStorage(event: StorageEvent) {
  if (event.key !== null && event.key !== "key") {
    return;
  }
  if (getLogoutComplete()) {
    reloadKernel();
    return;
  }

  if (event.key === null && getLoginComplete()) {
    return;
  }

  if (event.key === "key" && !getLoginComplete()) {
    let userKey = window.localStorage.getItem("key");
    if (userKey === null) {
      sendAuthUpdate();
      return;
    }
    let [decodedKey, errHTB] = hexToBuf(userKey);
    if (errHTB !== null) {
      logErr(addContextToErr(errHTB, "seed could not be decoded from hex"));
      sendAuthUpdate();
      return;
    }
    setUserKey(decodedKey);

    log("user is now logged in, attempting to load kernel");
    setLoginComplete(true);
    loadKernel();
    sendAuthUpdate();
    return;
  }
  setLogoutComplete(true);
  sendAuthUpdate();
  log("attempting to do a page reload");
  reloadKernel();
}

window.addEventListener("storage", (event) => handleStorage(event));
