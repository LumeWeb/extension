export const CONTENT_MODE_BUFFERED = "buffered";
export const CONTENT_MODE_CHUNKED = "chunked";
//export const CONTENT_MODE_STREAMED = "streamed";

export const contentModes: { [mimeType: string]: string } = {
  // Images
  "image/png": CONTENT_MODE_BUFFERED,
  "image/jpeg": CONTENT_MODE_BUFFERED,
  "image/x-citrix-jpeg": CONTENT_MODE_BUFFERED,
  "image/gif": CONTENT_MODE_BUFFERED,
  "image/webp": CONTENT_MODE_BUFFERED,

  //JS
  "application/javascript": CONTENT_MODE_CHUNKED,
};
