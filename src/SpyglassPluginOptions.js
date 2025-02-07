import {defaultHighlightStyle} from "@codemirror/language";
import {ConfigService, Logger, VanillaConfig} from "@spyglassmc/core";
import {PluginExternals} from "./Externals/PluginExternals.js";
import * as mcdoc from "@spyglassmc/mcdoc";
import * as je from "@spyglassmc/java-edition";

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
        this.rootFileSystem = object.rootFileSystem ?? null;
        this.cacheFileSystem = object.cacheFileSystem ?? null;

        let options = object.spyglassOptions ?? {};
        if (!options.project) {
            // noinspection JSValidateTypes
            options.project = {};
        }
        if (!options.project.externals) {
            options.project.externals = PluginExternals;
        }
        if (!options.project.initializers) {
            options.project.initializers = [];
        }
        for (let initializer of [mcdoc.initialize, je.initialize]) {
            if (!options.project.initializers.includes(initializer)) {
                options.project.initializers.push(initializer);
            }
        }
        if (!options.project.defaultConfig) {
            options.project.defaultConfig = ConfigService.merge(VanillaConfig, {
                env: {dependencies: []},
                lint: {undeclaredSymbol: false}
            });
        }
        if (!options.logger) {
            options.logger = Logger.noop();
        }

        this.spyglassOptions = options;
        return this;
    }
}
