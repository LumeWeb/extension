const extToMimes = new Map(
  Object.entries({
    html: "text/html",
    xhtml: "application/xhtml+xml",
    xml: "application/xml",
  })
);
Object.freeze(extToMimes);

export default extToMimes;
