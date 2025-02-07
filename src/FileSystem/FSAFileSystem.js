import {DummyFsWatcher} from "../../index.js";

/**
 * A file system based on the new File System Access API.
 *
 * @implements {import("@spyglassmc/core").ExternalFileSystem}
 */
export default class FSAFileSystem {
    /** @type {boolean|null} */ static supported = null;

    /** @type {FileSystemDirectoryHandle} */ root;

    /**
     * @return {Promise<boolean>}
     */
    static async isSupported() {
        if (this.supported === null) {
            this.supported = await this.checkBrowserSupport();
        }
        return this.supported;
    }

    /**
     * @return {Promise<boolean>}
     */
    static async checkBrowserSupport() {
        if (typeof navigator.storage?.getDirectory !== 'function') {
            return false;
        }
        let dir;
        try {
            dir = await navigator.storage.getDirectory();
        } catch (e) {
            return false;
        }

        // noinspection JSUnresolvedVariable,JSUnresolvedFunction
        if(typeof dir.queryPermission === 'function' && await dir.queryPermission({mode: 'readwrite'}) === 'granted') {
            return true;
        }

        // Some browsers support file system access, but not the method to check for permission.
        // In this case we try to create a file and check if it was created.
        let match = false;
        try {
            let name = 'test-' + Random.getString(8) + '.txt';
            let file = await dir.getFileHandle(name, {create: true});
            match = file.name === name && file.kind === 'file';
            await dir.removeEntry(name);
        } catch (e) {
            return false;
        }
        return match;
    }

    /**
     * @param {string} identifier
     * @return {Promise<FSAFileSystem>}
     */
    static async create(identifier) {
        let tempDir = await navigator.storage.getDirectory();
        let rootName = `spyglass_${identifier.replace(/\//g, '_')}`;
        let root = await tempDir.getDirectoryHandle(rootName, {create: true});
        return new this(root);
    }

    /**
     * @param {FileSystemDirectoryHandle} root
     */
    constructor(root) {
        this.root = root;
    }

    /**
     * @param location
     * @return {string[]}
     */
    splitPath(location) {
        let prefix = 'file://';
        let str = location.toString();
        if (!str.startsWith(prefix)) {
            throw new Error(`EACCES: ${str}`);
        }
        str = str.substring(prefix.length);
        return str.split('/').filter(part => part.length);
    }

    /**
     * @param location
     * @param resolveParent
     * @return {Promise<FileSystemDirectoryHandle|FileSystemFileHandle>}
     */
    async resolve(location, resolveParent = false) {
        let parts = this.splitPath(location);
        let baseName = parts.pop();

        let current = this.root;
        for (let part of parts) {
            if (!(current instanceof FileSystemDirectoryHandle)) {
                throw new Error(`ENOTDIR: ${location}`);
            }

            try {
                current = await current.getDirectoryHandle(part);
            } catch (e) {
                throw new Error(`ENOENT: ${location}: ${e.message}`);
            }
        }

        if (!resolveParent) {
            for await (let entry of current.values()) {
                if (entry.name === baseName) {
                    return entry;
                }
            }
            throw new Error(`ENOENT: ${location}`);
        }

        return current;
    }

    /**
     * @inheritDoc
     */
    async chmod(_location, _mode) {
    }

    /**
     * @inheritDoc
     */
    async mkdir(location, options = {}) {
        let parts = this.splitPath(location);
        if (options.recursive || true) {
            let current = this.root;
            for (let part of parts) {
                if (!(current instanceof FileSystemDirectoryHandle)) {
                    throw new Error(`ENOTDIR: ${location}`);
                }

                try {
                    current = await current.getDirectoryHandle(part, {create: true});
                } catch (e) {
                    throw new Error(`EEXIST: ${location}`);
                }
            }
            return;
        }

        let parent = await this.resolve(location, true);
        let name = parts[parts.length - 1];
        try {
            await parent.getDirectoryHandle(name, {create: true});
        } catch (e) {
            throw new Error(`EEXIST: ${location}`);
        }
    }

    /**
     * @inheritDoc
     */
    async readdir(location) {
        let dir = await this.resolve(location);
        if (!(dir instanceof FileSystemDirectoryHandle)) {
            throw new Error(`ENOTDIR: ${location}`);
        }

        let result = [];
        for await (/** @type {FileSystemDirectoryHandle|FileSystemFileHandle} */ let entry of dir.values()) {
            /** @type {FileSystemDirectoryHandle|FileSystemFileHandle} */
            result.push({
                name: entry.name,
                isDirectory: () => entry.kind === 'directory',
                isFile: () => entry.kind === 'file',
                isSymbolicLink: () => false
            });
        }
        return result;
    }

    /**
     * @inheritDoc
     */
    async readFile(location) {
        let file = await this.resolve(location);
        if (!(file instanceof FileSystemFileHandle)) {
            throw new Error(`EISDIR: ${location}`);
        }

        let blob = await file.getFile();
        return await new Promise((resolve, reject) => {
            let reader = new FileReader();
            reader.onload = () => resolve(new Uint8Array(reader.result));
            reader.onerror = () => reject(new Error(`EPERM: ${location}: ${reader.error}`));
            reader.readAsArrayBuffer(blob);
        });
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
        let entry = await this.resolve(location);
        return {
            isDirectory: () => entry.kind === 'directory',
            isFile: () => entry.kind === 'file'
        };
    }

    /**
     * @inheritDoc
     */
    async unlink(location) {
        let parent = await this.resolve(location, true);
        let name = this.splitPath(location).pop();
        try {
            await parent.removeEntry(name);
        } catch (e) {
            throw new Error(`ENOENT: ${location}`);
        }
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
        let parent = await this.resolve(location, true);
        let name = this.splitPath(location).pop();
        let file;
        try {
            file = await parent.getFileHandle(name, {create: true});
        } catch (e) {
            throw new Error(`EEXIST: ${location}: ${e.message}`);
        }
        let writable;
        try {
            writable = await file.createWritable();
        } catch (e) {
            throw new Error(`EPERM: ${location}: ${e.message}`);
        }

        await writable.write(data);
        await writable.close();
    }
}
