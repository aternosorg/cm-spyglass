import { default as decompress } from 'decompress';
import * as fs from "node:fs";

const dataPath = new URL('data/', import.meta.url);
await fs.promises.mkdir(dataPath, { recursive: true });


async function buildDependency(url, name, stripLevel = null ) {
    let response = await fetch(url);
    let content = await response.arrayBuffer();

    let entries = await decompress(Buffer.from(content), { strip: stripLevel });

    let result = {};
    for (let entry of entries) {
        if (entry.type !== 'file') {
            continue;
        }
        insertFile(result, entry.path, entry.data.toString('base64'));
    }

    await fs.promises.writeFile(new URL(`${name}.js`, dataPath), `export const ${name} = ${JSON.stringify(result)};`);
}

function insertFile(object, path, content) {
    let parts = path.split('/');
    let current = object;
    for (let part of parts.slice(0, -1)) {
        if (part === '') {
            continue;
        }
        if (!current[part]) {
            current[part] = {};
        }
        current = current[part];
    }
    current[parts.pop()] = content;
}

await buildDependency('https://codeload.github.com/SpyglassMC/vanilla-mcdoc/legacy.tar.gz/refs/heads/main', 'vanillaMcdoc', 1);
