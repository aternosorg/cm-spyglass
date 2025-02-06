import BundledDependency from "./BundledDependency.js";
import JsonFileSystem from "../FileSystem/JsonFileSystem.js";
import {vanillaMcdoc} from "../../data/vanillaMcdoc.js";

export default class VanillaMcDocDependency extends BundledDependency {
    /**
     * @inheritDoc
     */
    getFileSystem() {
        return new JsonFileSystem(vanillaMcdoc);
    }

    /**
     * @inheritDoc
     */
    getIdentifier() {
        return "vanilla-mcdoc-bundled";
    }
}
