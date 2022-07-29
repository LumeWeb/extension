import {
  addContextToErr,
  b64ToBuf,
  bufToHex,
  bufToStr,
  computeRegistrySignature,
  defaultPortalList,
  deriveChildSeed,
  deriveRegistryEntryID,
  downloadSkylink,
  Ed25519Keypair,
  entryIDToSkylink,
  Err,
  hexToBuf,
  progressiveFetch,
  progressiveFetchResult,
  taggedRegistryEntryKeys,
  objAsString,
  verifyRegistryWriteResponse,
} from "libskynet";

var browser: any; // tsc

const defaultKernelResolverLink =
  "AQBFjXpEBwbMwkBwYg0gdkeAM-yy9vlajfLtZSee9f-MDg";

document.title = "kernel.skynet";
let header = document.createElement("h1");
header.textContent =
  "Something went wrong! You should not be visiting this page, this page should only be accessed via an invisible iframe.";
document.body.appendChild(header);

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
    "*"
  );
}
function log(...inputs: any) {
  bootloaderWLog(false, ...inputs);
}
function logErr(...inputs: any) {
  bootloaderWLog(true, ...inputs);
}

var handleIncomingMessage = function (event: MessageEvent) {
  if (event.source === null) {
    return;
  }
  if (event.source === window) {
    return;
  }

  if (!("nonce" in event.data)) {
    (event.source as WindowProxy).postMessage(
      {
        nonce: "N/A",
        method: "response",
        err: "message sent to kernel with no nonce",
      },
      event.origin
    );
    return;
  }

  if (!("method" in event.data)) {
    (event.source as WindowProxy).postMessage(
      {
        nonce: event.data.nonce,
        method: "response",
        err: "message sent to kernel with no method",
      },
      event.origin
    );
    return;
  }

  if (event.data.method === "requestOverride") {
    handleSkynetKernelRequestOverride(event);
    return;
  }

  (event.source as WindowProxy).postMessage(
    {
      nonce: event.data.nonce,
      method: "response",
      err:
        "unrecognized method (user may need to log in): " + event.data.method,
    },
    event.origin
  );
  return;
};
window.addEventListener("message", (event: MessageEvent) => {
  handleIncomingMessage(event);
});

let kernelFavicon: Uint8Array;
let blockForFavicon: Promise<void> = new Promise((resolve) => {
  try {
    let faviconURL = browser.runtime.getURL("icon@2x.png");
    fetch(faviconURL).then((response) => {
      response.arrayBuffer().then((faviconData) => {
        kernelFavicon = new Uint8Array(faviconData);
        resolve();
      });
    });
  } catch {
    kernelFavicon = new Uint8Array(0);
    resolve();
  }
});
let kernelAuthPage: Uint8Array;
let blockForAuthPage: Promise<void> = new Promise((resolve) => {
  try {
    let authURL = browser.runtime.getURL("auth.html");
    fetch(authURL).then((response) => {
      response.arrayBuffer().then((authData) => {
        kernelAuthPage = new Uint8Array(authData);
        resolve();
      });
    });
  } catch (err: any) {
    kernelAuthPage = new TextEncoder().encode(
      addContextToErr(err, "unable to load the kernel auth page")
    );
    resolve();
  }
});
function handleSkynetKernelRequestOverride(event: MessageEvent) {
  if (event.source === null) {
    return;
  }

  if (!event.origin.startsWith("moz")) {
    return;
  }
  if (event.data.data.method !== "GET") {
    return;
  }

  let respondOverride = function (headers: any, body: Uint8Array) {
    (event.source as WindowProxy).postMessage(
      {
        nonce: event.data.nonce,
        method: "response",
        err: null,
        data: {
          override: true,
          headers,
          body,
        },
      },
      event.origin
    );
  };

  if (event.data.data.url === "http://kernel.skynet/favicon.ico") {
    blockForFavicon.then(() => {
      let headers = [
        {
          name: "content-type",
          value: "image/png",
        },
      ];
      respondOverride(headers, kernelFavicon);
    });
    return;
  }

  if (event.data.data.url === "http://kernel.skynet/auth.html") {
    blockForAuthPage.then(() => {
      let headers = [
        {
          name: "content-type",
          value: "text/html; charset=utf8",
        },
      ];
      respondOverride(headers, kernelAuthPage);
    });
    return;
  }

  (event.source as WindowProxy).postMessage(
    {
      nonce: event.data.nonce,
      method: "response",
      err: null,
      data: {
        override: false,
      },
    },
    event.origin
  );
}

var handleStorage = function (event: StorageEvent) {
  if (event.key !== null && event.key !== "v1-seed") {
    return;
  }
  if (logoutComplete === true) {
    window.location.reload();
    return;
  }

  if (event.key === null && loginComplete === false) {
    return;
  }

  if (event.key === "v1-seed" && loginComplete === false) {
    let userSeedString = window.localStorage.getItem("v1-seed");
    if (userSeedString === null) {
      sendAuthUpdate();
      return;
    }
    let [decodedSeed, errHTB] = hexToBuf(userSeedString);
    if (errHTB !== null) {
      logErr(addContextToErr(errHTB, "seed could not be decoded from hex"));
      sendAuthUpdate();
      return;
    }
    userSeed = decodedSeed;

    log("user is now logged in, attempting to load kernel");
    loginComplete = true;
    loadKernel();
    sendAuthUpdate();
    return;
  }

  logoutComplete = true;
  sendAuthUpdate();
  log("attempting to do a page reload");
  window.location.reload();
};
window.addEventListener("storage", (event) => handleStorage(event));

function downloadKernel(
  kernelSkylink: string
): Promise<[kernelCode: string, err: Err]> {
  return new Promise((resolve) => {
    downloadSkylink(kernelSkylink).then(([fileData, err]) => {
      if (err === "404") {
        resolve(["", err]);
        return;
      }

      if (err !== null) {
        resolve([
          "",
          addContextToErr(err, "unable to download the default kernel"),
        ]);
        return;
      }

      let [kernelCode, errBBTS] = bufToStr(fileData);
      if (errBBTS !== null) {
        resolve([
          "",
          addContextToErr(err, "unable to decode the default kernel"),
        ]);
        return;
      }
      resolve([kernelCode, null]);
    });
  });
}

function downloadDefaultKernel(): Promise<[kernelCode: string, err: Err]> {
  return downloadKernel(defaultKernelResolverLink);
}

function setUserKernelAsDefault(keypair: Ed25519Keypair, dataKey: Uint8Array) {
  log(
    "user kernel not found, setting user kernel to " + defaultKernelResolverLink
  );

  let [defaultKernelSkylink, err64] = b64ToBuf(defaultKernelResolverLink);
  if (err64 !== null) {
    log("unable to convert default kernel link to a Uint8Array");
    return;
  }

  let [sig, errCRS] = computeRegistrySignature(
    keypair.secretKey,
    dataKey,
    defaultKernelSkylink,
    0n
  );
  if (errCRS !== null) {
    log(
      addContextToErr(
        errCRS,
        "unable to compute registry signature to set user kernel"
      )
    );
    return;
  }

  let dataKeyHex = bufToHex(dataKey);
  let endpoint = "/skynet/registry";
  let postBody = {
    publickey: {
      algorithm: "ed25519",
      key: Array.from(keypair.publicKey),
    },
    datakey: dataKeyHex,
    revision: 0,
    data: Array.from(defaultKernelSkylink),
    signature: Array.from(sig),
  };
  let fetchOpts = {
    method: "post",
    body: JSON.stringify(postBody),
  };

  progressiveFetch(
    endpoint,
    fetchOpts,
    defaultPortalList,
    verifyRegistryWriteResponse
  ).then((result: progressiveFetchResult) => {
    if (result.success !== true) {
      log("unable to update the user kernel registry entry\n", result.logs);
      return;
    }
    log(
      "successfully updated the user kernel registry entry to the default kernel"
    );
  });
}

function downloadUserKernel(): Promise<[kernelCode: string, err: Err]> {
  return new Promise((resolve) => {
    let kernelEntrySeed = deriveChildSeed(userSeed, "userPreferredKernel2");

    let [keypair, dataKey, errTREK] = taggedRegistryEntryKeys(
      kernelEntrySeed,
      "user kernel"
    );
    if (errTREK !== null) {
      resolve([
        "",
        addContextToErr(errTREK, "unable to create user kernel registry keys"),
      ]);
      return;
    }

    let [entryID, errREID] = deriveRegistryEntryID(keypair.publicKey, dataKey);
    if (errREID !== null) {
      resolve([
        "",
        addContextToErr(errREID, "unable to derive registry entry id"),
      ]);
      return;
    }
    let userKernelSkylink = entryIDToSkylink(entryID);

    downloadKernel(userKernelSkylink).then(([kernelCode, err]) => {
      if (err === "404") {
        downloadDefaultKernel().then(([defaultCode, errDefault]) => {
          if (errDefault === null) {
            setUserKernelAsDefault(keypair, dataKey);
          }
          resolve([defaultCode, errDefault]);
          return;
        });
        return;
      }
      log("found user kernel, using: " + userKernelSkylink);

      resolve([kernelCode, err]);
    });
  });
}

function loadKernel() {
  downloadUserKernel().then(([kernelCode, err]) => {
    if (err !== null) {
      let extErr = addContextToErr(err, "unable to download kernel");
      kernelLoaded = extErr;
      logErr(extErr);
      sendAuthUpdate();
      return;
    }

    try {
      window.eval(kernelCode);
      kernelLoaded = "success";
      sendAuthUpdate();
      log("kernel successfully loaded");
      return;
    } catch (err: any) {
      let extErr = addContextToErr(err, "unable to eval kernel");
      kernelLoaded = extErr;
      logErr(extErr);
      logErr(err.toString());
      console.error(extErr);
      console.error(err);
      sendAuthUpdate();
      return;
    }
  });
}

let loginComplete = false;
let logoutComplete = false;
let kernelLoaded = "not yet";
function sendAuthUpdate() {
  window.parent.postMessage(
    {
      method: "kernelAuthStatus",
      data: {
        loginComplete: loginComplete,
        kernelLoaded: kernelLoaded,
        logoutComplete: logoutComplete,
      },
    },
    "*"
  );
}
sendAuthUpdate();

let userSeed: Uint8Array;
function checkForLoadKernel() {
  let userSeedString = window.localStorage.getItem("v1-seed");
  if (userSeedString === null) {
    sendAuthUpdate();
    return;
  }
  let [decodedSeed, errHTB] = hexToBuf(userSeedString);
  if (errHTB !== null) {
    logErr(addContextToErr(errHTB, "seed could not be decoded from hex"));
    sendAuthUpdate();
    return;
  }
  userSeed = decodedSeed;

  log("user is already logged in, attempting to load kernel");
  loginComplete = true;
  sendAuthUpdate();
  loadKernel();
}

let accessFailedStr =
  "unable to get access to localStorage, user may need to reduce their privacy settings";
if (
  Object.prototype.hasOwnProperty.call(document, "requestStorageAccess") &&
  window.origin === "https://skt.us"
) {
  document
    .requestStorageAccess()
    .then(() => {
      checkForLoadKernel();
    })
    .catch((err) => {
      log(addContextToErr(err, accessFailedStr));
      sendAuthUpdate();
    });
} else {
  checkForLoadKernel();
}
