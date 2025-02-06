export default class ErrorFactory {
    /**
     * @param {string} kind
     * @param {string} message
     * @return {Error}
     */
    createKind(kind, message) {
        return new Error(`${kind}: ${message}`);
    }

    /**
     * @param {Error} e
     * @param {string} kind
     * @return {boolean}
     */
    isKind(e, kind) {
        return e instanceof Error && e.message.startsWith(kind);
    }
}
