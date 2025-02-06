export default class EditorSyncState {
    /** @type {boolean} */ synced = true;
    /** @type {?Promise} */ promise = null;
    /** @type {?Function} */ resolve = null;

    /**
     * Wait until the Spyglass service is synced with the Codemirror editor
     *
     * @return {Promise<void>}
     */
    wait() {
        if (this.synced) {
            return Promise.resolve();
        }

        if (this.promise !== null) {
            return this.promise;
        }

        this.promise = new Promise(resolve => {
            this.resolve = resolve;
        });
    }

    /**
     * Start the sync process
     */
    startSync() {
        this.synced = false;
    }

    /**
     * End the sync process
     */
    endSync() {
        this.synced = true;
        if (this.resolve !== null) {
            let resolve = this.resolve;
            this.resolve = null;
            this.promise = null;
            resolve();
        }
    }
}
