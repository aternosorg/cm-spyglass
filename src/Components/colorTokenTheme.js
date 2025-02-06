import { tags } from '@lezer/highlight';
import {EditorView} from "@codemirror/view";

export function getColorTokenTheme(highlightStyle) {
    let mapping = {
        "comment": tags.comment,
        "enum": tags.name,
        "enumMember": tags.propertyName,
        "function": tags.function(tags.variableName),
        "keyword": tags.keyword,
        "modifier": tags.modifier,
        "number": tags.number,
        "operator": tags.operator,
        "property": tags.propertyName,
        "string": tags.string,
        "struct": tags.typeName,
        "type": tags.typeName,
        "variable": tags.special(tags.variableName),
        "literal": tags.literal,
        "resourceLocation": tags.url,
        "vector": tags.typeName,
    }

    let result = {};
    for (let [key, tag] of Object.entries(mapping)) {
        let style = findHighlightTag(highlightStyle, tag);
        if (!style || !style.color) {
            continue;
        }

        result[`.spyglassmc-color-token-${key}`] = {color: style.color};
    }

    return EditorView.baseTheme(result);
}


/**
 * @param {import("@codemirror/language").HighlightStyle} highlightStyle
 * @param {import("@codemirror/language").Tag} tag
 * @return {import("@codemirror/language").TagStyle}
 */
function findHighlightTag(highlightStyle, tag) {
    for (let style of highlightStyle.specs) {
        if (style.tag === tag) {
            return style;
        }

        if (Array.isArray(style.tag) && style.tag.includes(tag)) {
            return style;
        }
    }
}
