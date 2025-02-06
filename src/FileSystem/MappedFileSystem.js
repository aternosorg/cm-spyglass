import DummyFsWatcher from "./DummyFsWatcher.js";
import MappedFileSystemEntry from "./Mapped/MappedFileSystemEntry.js";

/**
 * @implements {import("@spyglassmc/core").ExternalFileSystem}
 */
export default class MappedFileSystem {
    /** @type {MappedFileSystemEntry[]} */ fileSystems;

    /**
     * @param {MappedFileSystemEntry[]} fileSystems
     */
    constructor(fileSystems = []) {
        this.fileSystems = fileSystems;
    }

    /**
     * @param {string} sourceBaseUri
     * @param {import("@spyglassmc/core").ExternalFileSystem} fileSystem
     * @param {string} targetBaseUri
     * @return {this}
     */
    mount(sourceBaseUri, fileSystem, targetBaseUri = 'file:///') {
        this.fileSystems.push(new MappedFileSystemEntry(sourceBaseUri, targetBaseUri, fileSystem));
        return this;
    }

    /**
     * @param {string} sourceBaseUri
     * @return {this}
     */
    umount(sourceBaseUri) {
        this.fileSystems = this.fileSystems.filter(entry => entry.sourceBaseUri !== sourceBaseUri);
        return this;
    }

    /**
     * @param location
     * @return {[import("@spyglassmc/core").ExternalFileSystem, string]}
     */
    findFileSystem(location) {
        for (let entry of this.fileSystems) {
            let mapped = entry.map(location);
            if (mapped) {
                return [entry.getFileSystem(), mapped];
            }
        }

        throw new Error(`EACCES: ${location}`);
    }

    /**
     * @inheritDoc
     */
    async chmod(location, mode) {
        let [fs, mappedLocation] = this.findFileSystem(location);
        return await fs.chmod(mappedLocation, mode);
    }

    /**
     * @inheritDoc
     */
    async mkdir(location, _options) {
        let [fs, mappedLocation] = this.findFileSystem(location);
        return await fs.mkdir(mappedLocation);
    }

    /**
     * @inheritDoc
     */
    async readdir(location) {
        let [fs, mappedLocation] = this.findFileSystem(location);
        return await fs.readdir(mappedLocation);
    }

    /**
     * @inheritDoc
     */
    async readFile(location) {
        let [fs, mappedLocation] = this.findFileSystem(location);
        return await fs.readFile(mappedLocation);
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
        let [fs, mappedLocation] = this.findFileSystem(location);
        return await fs.stat(mappedLocation);
    }

    /**
     * @inheritDoc
     */
    async unlink(location) {
        let [fs, mappedLocation] = this.findFileSystem(location);
        return await fs.unlink(mappedLocation);
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
    async writeFile(location, data, options) {
        let [fs, mappedLocation] = this.findFileSystem(location);
        return await fs.writeFile(mappedLocation, data, options);
    }
}
