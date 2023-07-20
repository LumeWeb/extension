import {
  addContextToErr,
  downloadObject,
  Err,
  maybeInitDefaultPortals,
  setActivePortalMasterKey,
} from "@lumeweb/libweb";
import { log, logErr, sendAuthUpdate } from "./util.js";
import {
  defaultKernelLink,
  setKernelLoaded,
  setLoginComplete,
} from "./vars.js";
import { getStoredUserKey } from "./storage.js";
import { readableStreamToBlob } from "binconv";

export function boot() {
  let userKey;

  try {
    userKey = getStoredUserKey();
  } catch (e) {
    logErr(addContextToErr(e, "user key could not be fetched"));
    sendAuthUpdate();
    return;
  }

  if (!userKey) {
    sendAuthUpdate();
    return;
  }

  log("user is already logged in, attempting to load kernel");
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

  try {
    await new Promise(async (resolve, reject) => {
      const url = URL.createObjectURL(await readableStreamToBlob(kernelCode));

      const el = document.createElement("script");
      el.src = url;
      el.onload = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      el.onerror = (
        event: Event | string,
        source?: string,
        lineno?: number,
        colno?: number,
        error?: Error,
      ) => {
        URL.revokeObjectURL(url);
        reject(error);
      };

      document.head.appendChild(el);
    });

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
): Promise<[kernelCode: ReadableStream, err: Err]> {
  const [code, err] = await downloadObject(kernelCid);

  if (err != null) {
    return [null as any, err];
  }

  return [code, null];
}

function downloadDefaultKernel(): Promise<
  [kernelCode: ReadableStream, err: Err]
> {
  return downloadKernel(defaultKernelLink);
}
