import {
  addContextToErr,
  bufToStr,
  Err,
  hexToBuf,
  objAsString,
} from "@lumeweb/libweb";

declare var browser: any; // tsc

const defaultKernelLink = "RAC1FocOb2bQw6uwjN0AX__MJ8F-h71F5kvIgQPTKo7fQA";

document.title = "kernel.lume";
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
    "*",
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
      event.origin,
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
      event.origin,
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
    event.origin,
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
      addContextToErr(err, "unable to load the kernel auth page"),
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
      event.origin,
    );
  };

  if (event.data.data.url === "http://kernel.lume/favicon.ico") {
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

  if (event.data.data.url === "http://kernel.lume/auth.html") {
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
    event.origin,
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
  kernelSkylink: string,
): Promise<[kernelCode: string, err: Err]> {
  return new Promise((resolve) => {
    fetch(`https://web3portal.com/${kernelSkylink}`).then((result) => {
      if (result.status === 404) {
        resolve(["", result.status.toString()]);
        return;
      }
      if (!result.ok) {
        resolve(["", result.statusText]);
        return;
      }
      result
        .blob()
        .then((blob) => {
          return blob.arrayBuffer();
        })
        .then((data) => {
          let [kernelCode, errBBTS] = bufToStr(data);

          if (errBBTS !== null) {
            resolve([
              "",
              addContextToErr(null, "unable to decode the default kernel"),
            ]);
            return;
          }

          resolve([kernelCode, null]);
        });
    });
  });
}

function downloadDefaultKernel(): Promise<[kernelCode: string, err: Err]> {
  return downloadKernel(defaultKernelLink);
}

async function loadKernel() {
  let [kernelCode, err] = await downloadDefaultKernel();

  if (err !== null) {
    let extErr = addContextToErr(err, "unable to download kernel");
    kernelLoaded = extErr;
    logErr(extErr);
    sendAuthUpdate();
    return;
  }

  try {
    eval(kernelCode);
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
    "*",
  );
}
sendAuthUpdate();

var userSeed: Uint8Array;
function checkForLoadKernel() {
  let userSeedString = window.localStorage.getItem("v1-key");
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

checkForLoadKernel();
