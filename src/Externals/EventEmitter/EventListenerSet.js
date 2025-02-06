export default class EventListenerSet {
    /** @type {Set<function>} */ #all = new Set();
    /** @type {Set<function>} */ #once = new Set();

    /**
     * @param args
     * @return {boolean}
     */
    emit(...args) {
        if (!this.#all.size) {
            return false;
        }

        for (let listener of this.#all) {
            listener(...args);
            if (this.#once.has(listener)) {
                this.#all.delete(listener);
                this.#once.delete(listener);
            }
        }

        return true;
    }

    /**
     * @param {function} listener
     * @return {EventListenerSet}
     */
    on(listener) {
        this.#all.add(listener);
        return this;
    }

    /**
     * @param {function} listener
     * @return {EventListenerSet}
     */
    once(listener) {
        this.#all.add(listener);
        this.#once.add(listener);
        return this;
    }

    /**
     * @param {function} listener
     * @return {EventListenerSet}
     */
    off(listener) {
        this.#all.delete(listener);
        this.#once.delete(listener);
        return this;
    }
}
