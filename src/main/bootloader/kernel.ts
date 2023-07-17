import {
  addContextToErr,
  bufToStr,
  downloadObject,
  Err,
  getActivePortals,
  hexToBuf,
} from "@lumeweb/libweb";
import { sendAuthUpdate } from "./util.js";
import { log, logErr } from "@lumeweb/libkernel/kernel";
import {
  defaultKernelLink,
  setBootloaderPortals,
  setKernelLoaded,
  setLoginComplete,
} from "./vars.js";

export function boot() {
  let userKeyString = window.localStorage.getItem("key");
  if (userKeyString === null) {
    sendAuthUpdate();
    return;
  }
  let [decodedSeed, errHTB] = hexToBuf(userKeyString);
  if (errHTB !== null) {
    logErr(addContextToErr(errHTB, "seed could not be decoded from hex"));
    sendAuthUpdate();
    return;
  }

  log("user is already logged in, attempting to load kernel");
  setLoginComplete(true);
  sendAuthUpdate();
  loadKernel();
}

export async function loadKernel() {
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
