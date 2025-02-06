import DummyFsWatcher from "./DummyFsWatcher.js";
import Base64 from "../Util/Base64.js";

/**
 * A file system that reads from a JSON predefined object.
 *
 * @implements {import("@spyglassmc/core").ExternalFileSystem}
 */
export default class JsonFileSystem {
    /** @type {string} */ baseUri = 'file:///';
    /** @type {Object} */ entries;

    /**
     * @param {Object} entries
     */
    constructor(entries) {
        this.entries = entries;
    }

    /**
     * @param location
     * @return {string|Object}
     */
    findEntry(location) {
        let str = location.toString();
        if (!str.startsWith(this.baseUri)) {
            throw new Error(`EACCES: ${str}`);
        }
        let path = str.substring(this.baseUri.length);
        let parts = path.split("/");

        let current = this.entries;
        for (let part of parts) {
            if (!part.length) {
                continue;
            }
            current = current[part];
            if (typeof current === 'undefined') {
                throw new Error(`ENOENT: ${location}`);
            }
        }

        return current;
    }

    /**
     * @inheritDoc
     */
    async chmod(_location, _mode) {
        throw new Error('EPERM: Operation not permitted');
    }

    /**
     * @inheritDoc
     */
    async mkdir(_location, _options) {
        throw new Error('EPERM: Operation not permitted');
    }

    /**
     * @inheritDoc
     */
    async readdir(location) {
        let entry = this.findEntry(location);

        if (typeof entry !== 'object') {
            throw new Error(`ENOTDIR: ${location}`);
        }

        let result = [];
        for (let [key, value] of Object.entries(entry)) {
            if (typeof value === 'object') {
                result.push({
                    name: key,
                    isDirectory: () => true,
                    isFile: () => false,
                    isSymbolicLink: () => false
                });
            } else {
                result.push({
                    name: key,
                    isDirectory: () => false,
                    isFile: () => true,
                    isSymbolicLink: () => false
                });
            }
        }

        return result;
    }

    /**
     * @inheritDoc
     */
    async readFile(location) {
        let entry = this.findEntry(location);
        if (typeof entry !== 'string') {
            throw new Error(`EISDIR: ${location}`);
        }

        return Base64.decode(entry);
    }

    /**
     * @inheritDoc
     */
    async showFile(_path) {
        throw new Error('showFile not supported on browser');
    }

    /**
     * @inheritDoc
     */
    async stat(location) {
        let entry = this.findEntry(location);
        if (typeof entry === 'object') {
            return {
                isDirectory: () => true,
                isFile: () => false
            };
        }

        return {
            isDirectory: () => false,
            isFile: () => true
        };
    }

    /**
     * @inheritDoc
     */
    async unlink(_location) {
        throw new Error('EPERM: Operation not permitted');
    }

    /**
     * @inheritDoc
     */
    watch(_locations) {
        return new DummyFsWatcher();
    }

    /**
     * @inheritDoc
     */
    async writeFile(_location, _data, _options) {
        throw new Error('EPERM: Operation not permitted');
    }
}
