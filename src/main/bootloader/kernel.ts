import {
  addContextToErr,
  downloadObject,
  Err,
  getActivePortals,
  maybeInitDefaultPortals,
  setActivePortalMasterKey,
} from "@lumeweb/libweb";
import { log, logErr, sendAuthUpdate } from "./util.js";
import {
  defaultKernelLink,
  setBootloaderPortals,
  setKernelLoaded,
  setLoginComplete,
  setUserKey,
} from "./vars.js";
import { getStoredUserKey } from "./storage.js";
import { handleIncomingMessage } from "./messages.js";

export function boot() {
  let userKey;

  try {
    userKey = getStoredUserKey();
  } catch (e) {
    logErr(addContextToErr(e, "user key could not be fetched"));
    sendAuthUpdate();
    return;
  }

  log("user is already logged in, attempting to load kernel");
  setUserKey(userKey);
  setActivePortalMasterKey(userKey);
  setLoginComplete(true);
  sendAuthUpdate();
  loadKernel();
}

export async function loadKernel() {
  let [, portalLoadErr] = maybeInitDefaultPortals();
  if (portalLoadErr) {
    let err = addContextToErr(portalLoadErr, "unable to init portals");
    setKernelLoaded(err);
    logErr(err);
    sendAuthUpdate();
    return;
  }

  let [kernelCode, err] = await downloadDefaultKernel();

  if (err !== null) {
    let extErr = addContextToErr(err, "unable to download kernel");
    setKernelLoaded(extErr);
    logErr(extErr);
    sendAuthUpdate();
    return;
  }

  setBootloaderPortals(getActivePortals());

  try {
    eval(kernelCode);
    setKernelLoaded("success");
    sendAuthUpdate();
    log("kernel successfully loaded");
    return;
  } catch (err: any) {
    let extErr = addContextToErr(err, "unable to eval kernel");
    setKernelLoaded(extErr);
    logErr(extErr);
    logErr(err.toString());
    console.error(extErr);
    console.error(err);
    sendAuthUpdate();
    return;
  }
}

async function downloadKernel(
  kernelCid: string,
): Promise<[kernelCode: string, err: Err]> {
  const [code, err] = await downloadObject(kernelCid);

  if (err != null) {
    return ["", err];
  }

  return [code, null];
}

function downloadDefaultKernel(): Promise<[kernelCode: string, err: Err]> {
  return downloadKernel(defaultKernelLink);
}
