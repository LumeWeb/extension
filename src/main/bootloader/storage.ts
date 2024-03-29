import {
  addContextToErr,
  bytesToHex,
  hexToBytes,
  setActivePortalMasterKey,
} from "@lumeweb/libweb";
import {
  getLoginComplete,
  getLogoutComplete,
  setLoginComplete,
  setLogoutComplete,
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

  if (event.key === "key" && !getLoginComplete() && !getLogoutComplete()) {
    let userKey;

    try {
      userKey = getStoredUserKey();
    } catch (e) {
      logErr(addContextToErr(e, "user key could not be fetched"));
      sendAuthUpdate();
      return;
    }

    if (userKey === null) {
      sendAuthUpdate();
      return;
    }

    log("user is now logged in, attempting to load kernel");
    setActivePortalMasterKey(userKey);
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
window.addEventListener("storage", handleStorage);

export function saveUserKey(key: Uint8Array) {
  if (key.length) {
    window.localStorage.setItem("key", bytesToHex(key));
  } else {
    window.localStorage.removeItem("key");
    setLogoutComplete(true);
  }
  const event = new StorageEvent("storage", {
    key: "key",
  });
  window.dispatchEvent(event);
}

export function getStoredUserKey() {
  const key = window.localStorage.getItem("key");

  if (key) {
    return hexToBytes(key);
  }

  return null;
}
