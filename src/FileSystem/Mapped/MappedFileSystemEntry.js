export default class MappedFileSystemEntry {
    /** @type {string} */ sourceBaseUri;
    /** @type {string} */ targetBaseUri;
    /** @type {import("@spyglassmc/core").ExternalFileSystem} */ fileSystem;

    /**
     * @param {string} sourceBaseUri
     * @param {string} targetBaseUri
     * @param {import("@spyglassmc/core").ExternalFileSystem} fileSystem
     */
    constructor(sourceBaseUri, targetBaseUri, fileSystem) {
        if (!sourceBaseUri.endsWith('/')) {
            sourceBaseUri += '/';
        }
        if (!targetBaseUri.endsWith('/')) {
            targetBaseUri += '/';
        }

        this.sourceBaseUri = sourceBaseUri;
        this.targetBaseUri = targetBaseUri;
        this.fileSystem = fileSystem;
    }

    /**
     * Map a URI from the source to the target if it is within the source base URI.
     *
     * @param {string} location
     * @return {string|null}
     */
    map(location) {
        let str = location.toString();

        if (str + "/" === this.sourceBaseUri) {
            return this.targetBaseUri;
        }

        if (!str.startsWith(this.sourceBaseUri)) {
            return null;
        }

        return this.targetBaseUri + str.substring(this.sourceBaseUri.length);
    }

    /**
     * @return {import("@spyglassmc/core").ExternalFileSystem}
     */
    getFileSystem() {
        return this.fileSystem;
    }
}
