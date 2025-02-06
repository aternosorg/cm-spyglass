import EventListenerSet from "./EventListenerSet.js";

export default class EventEmitter {
    /** @type {Map<string, EventListenerSet>} */ #listeners = new Map();

    /**
     * @param {string} event
     * @param {function} listener
     * @return {EventEmitter}
     */
    on(event, listener) {
        if (!this.#listeners.has(event)) {
            this.#listeners.set(event, new EventListenerSet());
        }

        this.#listeners.get(event).on(listener);
        return this;
    }

    /**
     * @param {string} event
     * @param {function} listener
     * @return {EventEmitter}
     */
    once(event, listener) {
        if (!this.#listeners.has(event)) {
            this.#listeners.set(event, new EventListenerSet());
        }

        this.#listeners.get(event).once(listener);
        return this;
    }

    /**
     * @param {string} event
     * @param {function} listener
     * @return {EventEmitter}
     */
    off(event, listener) {
        if (this.#listeners.has(event)) {
            this.#listeners.get(event).off(listener);
        }

        return this;
    }

    /**
     * @param {string} event
     * @param args
     * @return {boolean}
     */
    emit(event, ...args) {
        if (!this.#listeners.has(event)) {
            return false;
        }

        return this.#listeners.get(event).emit(...args);
    }
}
