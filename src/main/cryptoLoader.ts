(async function () {
  if (!window.crypto.subtle) {
    let el = document.createElement("script");
    // @ts-ignore
    let script = await fetch(browser.runtime.getURL("crypto.js"));
    let url = URL.createObjectURL(await script.blob());
    el.src = url;
    el.onload = () => {
      URL.revokeObjectURL(url);
    };
    document.head.appendChild(el);
  }
})();
