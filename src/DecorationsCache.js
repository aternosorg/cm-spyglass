import {Decoration} from "@codemirror/view";

export default class DecorationsCache {
    /** @type {import("@codemirror/view").DecorationSet} */ decorations = Decoration.none;
    /** @type {?number} */ version = null;

    /**
     * @param {number} version
     * @param {import("@codemirror/view").DecorationSet} decorations
     * @return {this}
     */
    set(version, decorations) {
        this.version = version;
        this.decorations = decorations;
        return this;
    }

    /**
     * @param {number} version
     * @return {boolean}
     */
    has(version) {
        return this.version === version;
    }

    /**
     * @return {import("@codemirror/view").DecorationSet}
     */
    get() {
        return this.decorations;
    }

    /**
     * @return {this}
     */
    flush() {
        this.version = null;
        this.decorations = Decoration.none;
        return this;
    }
}
