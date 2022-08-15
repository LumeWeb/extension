import Dexie from "dexie";

export const cacheDb = new Dexie("LumeWebIFSCache");

cacheDb.version(1).stores({
  items: `url,contentType,data,timestamp`,
});
