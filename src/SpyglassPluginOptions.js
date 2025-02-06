import {defaultHighlightStyle} from "@codemirror/language";
import {ConfigService, Logger, VanillaConfig} from "@spyglassmc/core";
import {PluginExternals} from "./Externals/PluginExternals.js";
import * as mcdoc from "@spyglassmc/mcdoc";
import * as je from "@spyglassmc/java-edition";
import MemoryFileSystem from "./FileSystem/MemoryFileSystem.js";
import LocalStorageFileSystem from "./FileSystem/LocalStorageFileSystem.js";

/**
 * @typedef {Object} SpyglassPluginOptionsObject
 * @property {string} [filePath]
 * @property {string} [languageId]
 * @property {import("@codemirror/language").HighlightStyle} [highlightStyle]
 * @property {BundledDependency[]} [dependencies]
 * @property {SpyglassOptions} [spyglassOptions]
 * @property {import("@spyglassmc/core").ExternalFileSystem} [rootFileSystem]
 * @property {import("@spyglassmc/core").ExternalFileSystem} [cacheFileSystem]
 */

/**
 * @typedef {Object} SpyglassOptions
 * @property {boolean} [isDebugging]
 * @property {import("@spyglassmc/core").Logger} [logger]
 * @property {import("@spyglassmc/core").ProfilerFactory} [profilers]
 * @property {import("@spyglassmc/core").ProjectOptions} [project]
 */

export default class SpyglassPluginOptions {
    /** @type {string} */ filePath;
    /** @type {string} */ languageId;
    /** @type {import("@codemirror/language").HighlightStyle} */ highlightStyle;
    /** @type {BundledDependency[]} */ dependencies;
    /** @type {SpyglassOptions} */ spyglassOptions;
    /** @type {import("@spyglassmc/core").ExternalFileSystem} */ rootFileSystem;
    /** @type {import("@spyglassmc/core").ExternalFileSystem} */ cacheFileSystem;

    /**
     * @param {SpyglassPluginOptionsObject} object
     * @returns {this}
     */
    load(object) {
        this.filePath = object.filePath ?? 'file.mcfunction';
        this.languageId = object.languageId ?? 'mcfunction';
        this.highlightStyle = object.highlightStyle ?? defaultHighlightStyle;
        this.dependencies = object.dependencies ?? [];
        this.rootFileSystem = object.rootFileSystem ?? new MemoryFileSystem();
        this.cacheFileSystem = object.cacheFileSystem ?? new LocalStorageFileSystem('cache');

        let baseOptions = /** @type {SpyglassOptions} */ {
            project: {
                externals: PluginExternals,
                initializers: [mcdoc.initialize, je.initialize],
                defaultConfig: ConfigService.merge(VanillaConfig, {
                    env: {dependencies: []},
                    lint: {undeclaredSymbol: false}
                })
            },
            logger: Logger.noop(),
        };

        this.spyglassOptions = this.deepmerge(baseOptions, object.spyglassOptions ?? {});
        return this;
    }

    /**
     * @template {Object} T
     * @param {T} target
     * @param {Object} source
     * @returns {T}
     */
    deepmerge(target, source) {
        for (const key in source) {
            if (source[key] instanceof Array) {
                if (!target[key]) {
                    target[key] = [];
                }
                target[key] = target[key].concat(source[key]);
            } else if (source[key] instanceof Object) {
                if (!target[key]) {
                    target[key] = {};
                }
                this.deepmerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
        return target;
    }
}
