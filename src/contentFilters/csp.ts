import ContentFilterBase from "../contentFilterBase.js";

export default class Csp extends ContentFilterBase {
  async filter(data: string): Promise<string> {
    let htmlDoc = new DOMParser().parseFromString(
      data as string,
      this.getMimeTypes().shift() as any
    );
    let found = htmlDoc.documentElement.querySelectorAll(
      'meta[http-equiv="Content-Security-Policy"]'
    );

    if (found.length) {
      found.forEach((item) => item.remove());
      data = htmlDoc.documentElement.outerHTML;
    }

    return data;
  }

  getMimeTypes(): string[] {
    return ["text/html"];
  }
}
