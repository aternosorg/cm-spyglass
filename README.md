# cm-spyglass

A [Codemirror](https://codemirror.net/) extension that provides syntax highlighting, linting, 
and autocompletion for Minecraft datapacks using [SpyglassMC](https://spyglassmc.com/),
loosely based on the [Spyglass Playground](https://github.com/SpyglassMC/Spyglass/tree/main/packages/playground).

## Installation

```sh
npm i cm-spyglass
```

## Usage

```js
let spyglass = new SpyglassPlugin({
    filePath: 'data/example/functions/hello.mcfunction',
    languageId: 'mcfunction',
    dependencies: [new VanillaMcDocDependency()]
});

let view = new EditorView({
    doc: content,
    extensions: [
        basicSetup,
        spyglass
    ],
    parent: parentElement
});
```

### Options

| Name              | Type                  | Description                                                |
|-------------------|-----------------------|------------------------------------------------------------|
| `filePath`        | `string`              | Path of the file being editrd relative to the project root |
| `languageId`      | `string`              | Language ID of the file being edited                       |
| `highlightStyle`  | `HighlightStyle`      | HighlightStyle used for syntax highlighting                |
| `dependencies`    | `BundledDependency[]` | Bundled project dependencies to load                       |
| `rootFileSystem`  | `ExternalFileSystem`  | Filesystem the project root should live in                 |
| `cacheFileSystem` | `ExternalFileSystem`  | Filesystem the Spyglass cache should live in               |
| `spyglassOptions` | `SpyglassOptions`     | Options to pass to the Spyglass service                    |

### Dependencies

Normally, dependencies are loaded at runtime from GitHub, which is not possible in a browser environment.
To work around this, dependencies can be added directly to the JavaScript bundle and loaded
as a [BundleDependency](src/Dependency/BundledDependency.js).

Bundled dependencies are simply stored as a JSON object containing all files in the dependency.
It is them mounted as a [JsonFileSystem](src/FileSystem/JsonFileSystem.js).

Bundling dependencies means that they are only updated when the extension if updated.

#### VanillaMcDocDependency

The only dependency currently bundled by default is `@vanilla-mcdoc`, which can be added to the SpyglassPlugin like so:

```js
import VanillaMcDocDependency from "cm-spyglass/src/Dependency/VanillaMcDocDependency";

let spyglass = new SpyglassPlugin({
    filePath: 'data/example/functions/hello.mcfunction',
    languageId: 'mcfunction',
    dependencies: [new VanillaMcDocDependency()]
});
```

It is not part of the package main file, so it is not included in JavaScript bundles if it is not used.

### Filesystems

Spyglass requires a virtual file system to work. This extension uses multiple different file systems mounted into the main
file system to provide different functionality for different parts of the Spyglass.

Ideally, the cache file system should be persistent, so reduce load times and prevent unnecessary requests.
The root file system does not need to be persistent.

To add additional files to a project (e.g. a pack.mcmeta file), you can add them to the root file system before passing
into the extension. A pack.mcmeta file will allow Spyglass to detect the Minecraft version used for the project.

#### MemoryFileSystem

The [MemoryFileSystem](src/FileSystem/MemoryFileSystem.js) is a simple in-memory file system that can be used to store files in memory.
It is both readable and writable, but does not store any data persistently.

#### LocalStorageFileSystem

The [LocalStorageFileSystem](src/FileSystem/LocalStorageFileSystem.js) is a file system that stores files in the browser's local storage.

#### JsonFileSystem

The [JsonFileSystem](src/FileSystem/JsonFileSystem.js) is a file system that reads predefined files from an object. It is read-only.

#### MappedFileSystem

The [MappedFileSystem](src/FileSystem/MappedFileSystem.js) does not handle any files itself, but can be used to mount other file systems at different paths.

