import Hex from "../Util/Hex.js";

export default class Crypto {
    /** @type {TextEncoder} */ textEncoder = new TextEncoder();

    /**
     * @param {Uint8Array|string} buffer
     * @return {Promise<string>}
     */
    async getSha1(buffer) {
        if (typeof buffer === 'string') {
            buffer = this.textEncoder.encode(buffer);
        }

        return Hex.encode(new Uint8Array(await crypto.subtle.digest('SHA-1', buffer)));
    }
}
