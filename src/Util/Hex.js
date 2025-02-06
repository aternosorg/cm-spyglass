export default class Hex {
    /**
     * @param {Uint8Array} input
     * @return {string}
     */
    static encode(input) {
        if (typeof input.toHex === 'function') {
            return input.toHex();
        }

        let result = '';
        for (let v of input) {
            result += v.toString(16).padStart(2, '0');
        }
        return result;
    }

    /**
     * @param {string} input
     * @return {Uint8Array}
     */
    static decode(input) {
        if (typeof Uint8Array.fromHex === 'function') {
            return Uint8Array.fromHex(input);
        }

        let length = Math.ceil(input.length / 2);
        let result = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
            result[i] = parseInt(input.substring(i * 2, i * 2 + 2), 16);
        }
        return result;
    }
}
