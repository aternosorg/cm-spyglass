/**
 * @implements {import("@spyglassmc/core").ExternalDownloader}
 */
export default class Downloader {

    /**
     * @inheritDoc
     */
    async get(uri, options = {}) {
        const headers = new Headers();

        if (options?.headers) {
            for (let [name, value] of Object.entries(options.headers)) {
                if (!Array.isArray(value)) {
                    value = [value];
                }
                for (let v of value) {
                    headers.append(name, v);
                }
            }
        }

        let res = await fetch(uri, {headers, redirect: 'follow'});
        if (!res.ok) {
            throw new Error(`Status code ${res.status}: ${res.ok}`);
        } else {
            return new Uint8Array(await res.arrayBuffer());
        }
    }
}
