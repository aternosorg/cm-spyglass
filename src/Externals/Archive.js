import * as fflate from "fflate";

export default class Archive {
    /**
     * @param {Uint8Array} buffer
     * @return {Promise<Uint8Array>}
     */
    async gunzip(buffer) {
        if (typeof DecompressionStream === 'undefined') {
            return fflate.gunzipSync(buffer);
        }

        return await this.pipeThroughStream(buffer, new DecompressionStream('gzip'));
    }

    /**
     * @param {Uint8Array} buffer
     * @return {Promise<Uint8Array>}
     */
    async gzip(buffer) {
        if (typeof CompressionStream === 'undefined') {
            return fflate.gzipSync(buffer);
        }

        return await this.pipeThroughStream(buffer, new CompressionStream('gzip'));
    }

    /**
     * @param {Uint8Array} _buffer
     * @param {{stripLevel?: number}} _options
     * @return {Promise<import("@spyglassmc/core").DecompressedFile[]>}
     */
    async decompressBall(_buffer, _options) {
        throw new Error('decompressBall not supported.');
    }

    /**
     * Pipe a buffer through a transform stream and return the result as a buffer.
     *
     * @param {Uint8Array} buffer
     * @param {GenericTransformStream} transformStream
     * @return {Promise<Uint8Array>}
     */
    async pipeThroughStream(buffer, transformStream) {
        let inputStream = new ReadableStream({
            start: (controller) => {
                controller.enqueue(buffer);
                controller.close();
            }
        });
        const resultStream = inputStream.pipeThrough(transformStream);
        return new Uint8Array(await new Response(resultStream).arrayBuffer());
    }
}
