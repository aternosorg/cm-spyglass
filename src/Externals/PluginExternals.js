import Archive from "./Archive.js";
import Crypto from "./Crypto.js";
import ErrorFactory from "./ErrorFactory.js";
import EventEmitter from "./EventEmitter/EventEmitter.js";
import Downloader from "./Downloader.js";

/**
 * @type {import("@spyglassmc/core").Externals}
 */
export const PluginExternals = {
    archive: new Archive(),
    crypto: new Crypto(),
    downloader: new Downloader(),
    error: new ErrorFactory(),
    event: {
        EventEmitter: EventEmitter
    },
    fs: null
};
