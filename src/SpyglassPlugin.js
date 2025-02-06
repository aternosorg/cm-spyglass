import {StateEffect, StateField} from "@codemirror/state";
import {FileNode, Service, VanillaConfig} from "@spyglassmc/core";
import MappedFileSystem from "./FileSystem/MappedFileSystem.js";
import {Decoration, EditorView} from "@codemirror/view";
import {autocompletion} from "@codemirror/autocomplete";
import EditorSyncState from "./EditorSyncState.js";
import DecorationsCache from "./DecorationsCache.js";
import Hint from "./Components/Hint.js";
import {getColorTokenTheme} from "./Components/colorTokenTheme.js";
import InitState from "./Components/InitState.js";
import {linter} from "@codemirror/lint";
import SpyglassPluginOptions from "./SpyglassPluginOptions.js";

/**
 * @implements {import("@codemirror/state").Extension}
 */
export default class SpyglassPlugin {
    /** @type {import("@codemirror/state").Extension} */ extension;

    /** @type {import("@spyglassmc/core").Service} */ service;
    /** @type {import("@spyglassmc/core").RootUriString} */ rootUri = 'file:///root/';
    /** @type {import("@spyglassmc/core").RootUriString} */ cacheUri = 'file:///cache/';
    /** @type {string} */ fileUri;
    /** @type {EditorSyncState} */ syncState = new EditorSyncState();
    /** @type {?number} */ editorUpdateTimeout = null;
    /** @type {number} */ documentVersion = 0;
    /** @type {DecorationsCache} */ decorationsCache = new DecorationsCache();
    /** @type {Object[]} */ changedRanges = [];
    /** @type {?number} */ lastLintedVersion = null;
    /** @type {number} */ initState = InitState.UNINITIALIZED;
    /** @type {SpyglassPluginOptions} */ options;

    /** @type {import("@codemirror/state").StateEffectType} */ updateDecorationsEffect = StateEffect.define();
    /** @type {import("@codemirror/state").Extension} */ editorUpdateListener;
    /** @type {import("@codemirror/state").Extension} */ completionHandler;
    /** @type {import("@codemirror/state").Extension} */ colorTokenField;

    /**
     * @param {SpyglassPluginOptionsObject} options
     */
    constructor(options) {
        this.options = new SpyglassPluginOptions().load(options);

        this.fileUri = this.rootUri + options.filePath;
        this.createSpyglassService();
        this.editorUpdateListener = EditorView.updateListener.of(this.handleEditorUpdate.bind(this));
        this.completionHandler = autocompletion({override: [this.handleCompletions.bind(this)]});
        this.colorTokenField = StateField.define({
            create() {
                return Decoration.none;
            },
            update: (value, tr) => {
                return this.decorate(value);
            },
            provide: (f) => EditorView.decorations.from(f),
        });

        this.extension = [
            this.completionHandler,
            this.editorUpdateListener,
            linter(this.lint.bind(this), { needsRefresh: this.isLintRefreshRequired.bind(this) }),
            this.colorTokenField,
            getColorTokenTheme(this.options.highlightStyle),
        ];
    }

    /**
     * Create the Spyglass service using the provided options
     * Bundled dependencies are mounted to the file system and initialized
     */
    createSpyglassService() {
        let spyglassOptions = this.options.spyglassOptions;
        spyglassOptions.project.cacheRoot = this.cacheUri;

        if (!spyglassOptions.project.defaultConfig) {
            spyglassOptions.project.defaultConfig = VanillaConfig;
        }

        let fileSystem = new MappedFileSystem()
            .mount(this.cacheUri, this.options.cacheFileSystem)
            .mount(this.rootUri, this.options.rootFileSystem);

        for (let dependency of this.options.dependencies) {
            spyglassOptions.project.defaultConfig.env.dependencies.push(dependency.getDependencyName());
            spyglassOptions.project.initializers.push(dependency.getInitializer());
            fileSystem.mount(dependency.getMountPoint(), dependency.getFileSystem(), dependency.getBaseUri());
        }

        spyglassOptions.project.externals.fs = fileSystem;
        spyglassOptions.project.projectRoots = [this.rootUri];

        // noinspection JSCheckFunctionSignatures
        this.service = new Service(spyglassOptions);
    }

    /**
     * @param {EditorView} view
     * @return {Promise<this>}
     */
    async initialize(view) {
        if (this.initState !== InitState.UNINITIALIZED) {
            return this;
        }

        this.initState = InitState.INITIALISING;
        await this.service.project.ready();
        await this.service.project.onDidOpen(
            this.fileUri,
            this.options.languageId,
            this.documentVersion,
            view.state.doc.toString()
        );
        await this.service.project.ensureClientManagedChecked(this.fileUri);
        this.service.logger.log('Loaded CodeMirror Spyglass plugin');
        this.initState = InitState.INITIALIZED;
        this.dispatchDecorationsUpdate(view);
        await this.service.project.cacheService.save();
        return this;
    }

    /**
     * @param update
     * @return {Promise<void>}
     */
    async handleEditorUpdate(update) {
        if (this.initState !== InitState.INITIALIZED) {
            await this.initialize(update.view);
            return;
        }

        if (!update.docChanged) {
            return;
        }

        this.changedRanges.push(...update.changedRanges);
        this.decorationsCache.flush();
        this.dispatchDecorationsUpdate(update.view);

        clearTimeout(this.editorUpdateTimeout);
        this.syncState.startSync();
        this.editorUpdateTimeout = setTimeout(async () => {
            let content = update.state.doc.toString();
            try {
                await this.service.project.onDidChange(this.fileUri, [{text: content}], ++this.documentVersion);
            } catch (e) {
                this.service.logger.error(e);
            }

            this.changedRanges = [];
            this.dispatchDecorationsUpdate(update.view);
            this.syncState.endSync();
        }, 20);
    }

    /**
     * Check if linter should be run again
     *
     * @return {boolean}
     */
    isLintRefreshRequired() {
        let docAndNode = this.service.project.getClientManaged(this.fileUri);
        if (!docAndNode) {
            return false;
        }

        return this.lastLintedVersion !== docAndNode.doc.version;
    }

    /**
     * @param {EditorView} view
     * @return {this}
     */
    dispatchDecorationsUpdate(view) {
        let transaction = view.state.update({
            effects: this.updateDecorationsEffect.of(null)
        });
        view.dispatch(transaction);
        return this;
    }

    /**
     * Apply linting to the current file.
     *
     * @return {Hint[]}
     */
    lint() {
        let docAndNode = this.service.project.getClientManaged(this.fileUri);
        if (!docAndNode) {
            return [];
        }
        const {node, doc} = docAndNode;
        this.lastLintedVersion = doc.version;

        let hints = [];
        for (let error of FileNode.getErrors(node)) {
            let start = error.range.start;
            let end = error.range.end;
            [start, end] = this.mapRangeToChanges(start, end);
            if (end < start) {
                continue;
            }

            hints.push(new Hint(
                start,
                end,
                error.message,
                error.severity === 3 ? 'error' : 'warning'
            ));
        }
        return hints;
    }

    /**
     * @param {import("@codemirror/view").DecorationSet} previous
     * @return {import("@codemirror/view").DecorationSet}
     */
    decorate(previous = Decoration.none) {
        let docAndNode = this.service.project.getClientManaged(this.fileUri)
        if (!docAndNode) {
            return previous;
        }
        let {node, doc} = docAndNode;
        if (this.decorationsCache.has(doc.version)) {
            return this.decorationsCache.get();
        }

        let tokens = this.service.colorize(node, doc)
        let decorations = Decoration.none;
        for (let token of tokens) {
            let [start, end] = this.mapRangeToChanges(token.range.start, token.range.end);
            if (end <= start) {
                continue;
            }

            decorations = decorations.update({
                add: [this.getColorTokenMark(token).range(start, end)],
            });
        }
        this.decorationsCache.set(doc.version, decorations);
        return decorations;
    }

    /**
     * Create a Codemirror decoration for a Spyglass color token
     *
     * @param t
     * @return {Decoration}
     */
    getColorTokenMark(t) {
        return Decoration.mark({
            class: `spyglassmc-color-token-${t.type} ${
                t.modifiers?.map((m) => `spyglassmc-color-token-modifier-${m}`).join() ?? ''
            }`,
        });
    }

    /**
     * Map highlight/hint ranges from spyglass to the actual locations in the editor,
     * based on what has changed since the last update.
     *
     * @param {number} start
     * @param {number} end
     * @return {[number, number]}
     */
    mapRangeToChanges(start, end) {
        for (let change of this.changedRanges) {
            if (start >= change.toA) {
                start += change.toB - change.toA;
                end += change.toB - change.toA;
                continue;
            }

            if (start >= change.fromA && end < change.toA) {
                start = 0;
                end = 0;
                continue;
            }

            if (end >= change.fromA && end <= change.toA) {
                end = Math.min(end, change.toB);
            }
        }

        return [start, end];
    }

    /**
     * Show completions for the current cursor position
     *
     * @param {import("@codemirror/autocomplete").CompletionContext} ctx
     * @return {Promise<?import("@codemirror/autocomplete").CompletionResult>}
     */
    async handleCompletions(ctx) {
        await this.syncState.wait();
        let docAndNodes = await this.service.project.ensureClientManagedChecked(this.fileUri)
        if (!docAndNodes) {
            return null
        }
        let items = this.service.complete(docAndNodes.node, docAndNodes.doc, ctx.pos)
        if (!items.length) {
            return null
        }
        return {
            from: items[0].range.start,
            to: items[0].range.end,
            options: items.map((v) => ({label: v.label, detail: v.detail, info: v.documentation})),
        }
    }
}
