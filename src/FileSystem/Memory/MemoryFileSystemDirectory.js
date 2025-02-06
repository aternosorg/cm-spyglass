import MemoryFileSystemEntry from "./MemoryFileSystemEntry.js";

export default class MemoryFileSystemDirectory extends MemoryFileSystemEntry {
    /** @type {Map<string, MemoryFileSystemEntry>} */ entries = new Map();

    /**
     * @param {string} name
     * @param {MemoryFileSystemEntry} entry
     * @return {this}
     */
    addEntry(name, entry) {
        this.entries.set(name, entry);
        return this;
    }

    /**
     * @param {string} name
     * @return {?MemoryFileSystemEntry}
     */
    getEntry(name) {
        return this.entries.get(name) ?? null;
    }

    /**
     * @return {IterableIterator<[string, MemoryFileSystemEntry]>}
     */
    getEntries() {
        return this.entries.entries();
    }

    /**
     * @param {string} name
     * @return {boolean}
     */
    hasEntry(name) {
        return this.entries.has(name);
    }

    /**
     * @param {string} name
     * @return {this}
     */
    removeEntry(name) {
        this.entries.delete(name);
        return this;
    }
}
