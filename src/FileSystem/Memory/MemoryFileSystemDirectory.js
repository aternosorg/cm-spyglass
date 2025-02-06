import MemoryFileSystemEntry from "./MemoryFileSystemEntry.js";

export default class MemoryFileSystemDirectory extends MemoryFileSystemEntry {
    /** @type {Map<string, MemoryFileSystemEntry>} */ entries = new Map();

    /**
     * @param {string} name
     * @param {MemoryFileSystemEntry} entry
     * @return {Promise<this>}
     */
    async addEntry(name, entry) {
        this.entries.set(name, entry);
        return this;
    }

    /**
     * @param {string} name
     * @return {Promise<?MemoryFileSystemEntry>}
     */
    async getEntry(name) {
        return this.entries.get(name) ?? null;
    }

    /**
     * @return {Promise<Iterable<[string, MemoryFileSystemEntry]>>}
     */
    async getEntries() {
        return this.entries.entries();
    }

    /**
     * @param {string} name
     * @return {Promise<boolean>}
     */
    async hasEntry(name) {
        return this.entries.has(name);
    }

    /**
     * @param {string} name
     * @return {Promise<this>}
     */
    async removeEntry(name) {
        this.entries.delete(name);
        return this;
    }
}
