import { Crypto } from "@peculiar/webcrypto";

let globalCrypto = window.crypto;
if (!globalCrypto.subtle) {
  let subtleCrypto = new Crypto().subtle;
  Object.defineProperty(globalCrypto, "subtle", {
    get() {
      return subtleCrypto;
    },
  });
}
