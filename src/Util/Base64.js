import {decode, encode} from "base64-arraybuffer";

export default class Base64 {
    /**
     * @param {Uint8Array} input
     * @return {string}
     */
    static encode(input) {
        if (typeof input.toBase64 === 'function') {
            return input.toBase64();
        }

        let buffer;
        if (input.byteOffset !== 0 || input.byteLength !== input.buffer.byteLength) {
            buffer = new ArrayBuffer(input.byteLength);
            new Uint8Array(buffer).set(input);
        } else {
            buffer = input.buffer;
        }

        return encode(buffer);
    }

    /**
     * @param {string} input
     * @return {Uint8Array}
     */
    static decode(input) {
        if (typeof Uint8Array.fromBase64 === 'function') {
            return Uint8Array.fromBase64(input);
        }

        return new Uint8Array(decode(input));
    }
}
