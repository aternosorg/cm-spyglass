import MemoryFileSystemEntry from "./MemoryFileSystemEntry.js";

export default class MemoryFileSystemFile extends MemoryFileSystemEntry {
    /** @type {Uint8Array} */ content;

    /**
     * @param {Uint8Array} content
     */
    constructor(content) {
        super();
        this.content = content;
    }

    /**
     * @return {Promise<Uint8Array>}
     */
    async getContent() {
        return this.content;
    }
}
