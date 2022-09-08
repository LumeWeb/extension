import ContentFilterBase from "./contentFilterBase.js";

export default class ContentFilterRegistry {
  private static contentFilters: ContentFilterBase[] = [];

  public static hasFilters(type: string): boolean {
    return (
      ContentFilterRegistry.contentFilters.filter((item) =>
        item.getMimeTypes().includes(type)
      ).length > 0
    );
  }

  public static filter(type: string) {
    return async (data: Uint8Array) => {
      const filters = ContentFilterRegistry.contentFilters.filter((item) =>
        item.getMimeTypes().includes(type)
      );

      if (!filters.length) {
        return data;
      }

      let filterData = new TextDecoder().decode(data);

      for (const filter of filters) {
        filterData = await filter.filter(filterData);
      }

      return new TextEncoder().encode(filterData);
    };
  }

  public static registerFilter(contentFilter: ContentFilterBase): void {
    ContentFilterRegistry.contentFilters.push(contentFilter);
  }
}
