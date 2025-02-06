export default class Hint {
    /** @type {number} */ from;
    /** @type {number} */ to;
    /** @type {string} */ message;
    /** @type {string} */ severity;

    constructor(from, to, message, severity = 'error') {
        this.from = from;
        this.to = to;
        this.message = message;
        this.severity = severity;
    }
}
