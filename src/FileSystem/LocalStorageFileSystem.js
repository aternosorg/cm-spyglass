import DummyFsWatcher from "./DummyFsWatcher.js";
import {fileUtil} from "@spyglassmc/core";
import Base64 from "../Util/Base64.js";

/**
 * @implements {import("@spyglassmc/core").ExternalFileSystem}
 */
export default class LocalStorageFileSystem {
    static KEY_PREFIX = 'spyglassmc-browser-fs';

    /** @type {Object} */ states;
    /** @type {string} */ id;

    /**
     * @param {string} id
     */
    constructor(id) {
        this.id = id;
        this.states = JSON.parse(localStorage.getItem(this.getKey()) ?? '{}');
    }

    /**
     * Save the states to local storage
     */
    saveStates() {
        localStorage.setItem(this.getKey(), JSON.stringify(this.states));
    }

    /**
     * Get the key for the states in local storage
     *
     * @return {string}
     */
    getKey() {
        return `${this.constructor.KEY_PREFIX}-${this.id}`;
    }

    /**
     * @inheritDoc
     */
    async chmod(_location, _mode) {
    }

    /**
     * @inheritDoc
     */
    async mkdir(location, _options) {
        location = fileUtil.ensureEndingSlash(location.toString());
        if (this.states[location]) {
            throw new Error(`EEXIST: ${location}`);
        }
        this.states[location] = { type: 'directory' };
        this.saveStates();
    }

    /**
     * @inheritDoc
     */
    async readdir(_location) {
        // Not implemented
        return [];
    }

    /**
     * @inheritDoc
     */
    async readFile(location) {
        location = location.toString();
        let entry = this.states[location];
        if (!entry) {
            throw new Error(`ENOENT: ${location}`);
        }
        else if (entry.type === 'directory') {
            throw new Error(`EISDIR: ${location}`);
        }
        return Base64.decode(entry.content);
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
        location = location.toString();
        let entry = this.states[location];
        if (!entry) {
            throw new Error(`ENOENT: ${location}`);
        }
        return { isDirectory: () => entry.type === 'directory', isFile: () => entry.type === 'file' };
    }

    /**
     * @inheritDoc
     */
    async unlink(location) {
        location = location.toString();
        let entry = this.states[location];
        if (!entry) {
            throw new Error(`ENOENT: ${location}`);
        }
        delete this.states[location];
        this.saveStates();
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
    async writeFile(location, data, _options) {
        location = location.toString();
        if (typeof data === 'string') {
            data = new TextEncoder().encode(data);
        }
        data = Base64.encode(data);
        this.states[location] = { type: 'file', content: data };
        this.saveStates();
    }
}
