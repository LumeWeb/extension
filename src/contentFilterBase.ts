export default abstract class ContentFilterBase {
  abstract getMimeTypes(): string[];
  abstract filter(data: string): Promise<string>;
}
