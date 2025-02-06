import MemoryFileSystemDirectory from "./Memory/MemoryFileSystemDirectory.js";
import MemoryFileSystemFile from "./Memory/MemoryFileSystemFile.js";
import DummyFsWatcher from "./DummyFsWatcher.js";

/**
 * @implements {import("@spyglassmc/core").ExternalFileSystem}
 */
export default class MemoryFileSystem {
    /** @type {MemoryFileSystemDirectory} */ root = new MemoryFileSystemDirectory();
    /** @type {string} */ baseUri = 'file:///';

    /**
     * @param location
     * @return {string[]}
     */
    getPathParts(location) {
        let str = location.toString();
        if (!str.startsWith(this.baseUri)) {
            throw new Error(`EACCES: ${str}`);
        }
        if (str.endsWith("/")) {
            str = str.substring(0, str.length - 1);
        }

        let path = str.substring(this.baseUri.length);
        return path.split("/");
    }

    /**
     * @param location
     * @param {boolean} parent If true, return the parent directory of the entry
     * @return {Promise<MemoryFileSystemEntry>}
     */
    async findEntry(location, parent = false) {
        let parts = this.getPathParts(location);

        if (parent) {
            parts.pop();
        }

        let current = this.root;
        for (let part of parts) {
            if (!part.length) {
                continue;
            }

            if (!(current instanceof MemoryFileSystemDirectory)) {
                throw new Error(`ENOTDIR: ${location}`);
            }

            current = await current.getEntry(part);
            if (current === null) {
                throw new Error(`ENOENT: ${location}`);
            }
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
    async mkdir(location, options) {
        let parts = this.getPathParts(location);
        if (options.recursive) {
            let current = this.root;
            for (let part of parts) {
                if (!part.length) {
                    continue;
                }

                let next = await current.getEntry(part);
                if (next === null) {
                    next = new MemoryFileSystemDirectory();
                    await current.addEntry(part, next);
                } else if (!(next instanceof MemoryFileSystemDirectory)) {
                    throw new Error(`EEXIST: ${location}`);
                }

                current = next;
            }
        }

        let parent = await this.findEntry(location, true);
        let basename = parts.pop();
        if (!(parent instanceof MemoryFileSystemDirectory)) {
            throw new Error(`ENOTDIR: ${location}`);
        }
        if (await parent.hasEntry(basename)) {
            throw new Error(`EEXIST: ${location}`);
        }

        await parent.addEntry(basename, new MemoryFileSystemDirectory());
    }

    /**
     * @inheritDoc
     */
    async readdir(location) {
        let directory = await this.findEntry(location);

        if (!(directory instanceof MemoryFileSystemDirectory)) {
            throw new Error(`ENOTDIR: ${location}`);
        }

        let result = [];
        for (let [name, entry] of await directory.getEntries()) {
            let isDirectory = entry instanceof MemoryFileSystemDirectory;
            result.push({
                name: name,
                isDirectory: () => isDirectory,
                isFile: () => !isDirectory,
                isSymbolicLink: () => false
            });
        }

        return result;
    }

    /**
     * @inheritDoc
     */
    async readFile(location) {
        let entry = await this.findEntry(location);
        if (!(entry instanceof MemoryFileSystemFile)) {
            throw new Error(`EISDIR: ${location}`);
        }

        return await entry.getContent();
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
        let entry = await this.findEntry(location);
        let isDirectory = entry instanceof MemoryFileSystemDirectory;

        return {
            isDirectory: () => isDirectory,
            isFile: () => !isDirectory
        };
    }

    /**
     * @inheritDoc
     */
    async unlink(location) {
        let parts = this.getPathParts(location);
        let parent = await this.findEntry(location, true);
        let basename = parts.pop();
        if (!(parent instanceof MemoryFileSystemDirectory) || !await parent.hasEntry(basename)) {
            throw new Error(`ENOENT: ${location}`);
        }

        await parent.removeEntry(basename);
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
        let parts = this.getPathParts(location);
        let parent = await this.findEntry(location, true);
        let basename = parts.pop();

        if (!(parent instanceof MemoryFileSystemDirectory)) {
            throw new Error(`ENOENT: ${location}`);
        }

        if (await parent.hasEntry(basename) && !(await parent.getEntry(basename) instanceof MemoryFileSystemFile)) {
            throw new Error(`EISDIR: ${location}`);
        }

        await parent.addEntry(basename, new MemoryFileSystemFile(data));
    }
}
