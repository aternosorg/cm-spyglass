export default class BundledDependency {
    /**
     * @return {string}
     * @abstract
     */
    getIdentifier() {

    }

    /**
     * @return {import("@spyglassmc/core").ExternalFileSystem}
     * @abstract
     */
    getFileSystem() {

    }

    /**
     * @return {string}
     */
    getBaseUri() {
        return 'file:///';
    }

    /**
     * @return {string}
     */
    getMountPoint() {
        return `file:///${this.getIdentifier()}/`;
    }

    /**
     * @return {import("@spyglassmc/core").DependencyKey}
     */
    getDependencyName() {
        // noinspection JSValidateTypes
        return `@${this.getIdentifier()}`;
    }

    /**
     * @return {Function}
     */
    getInitializer() {
        return (ctx) => {
            ctx.meta.registerDependencyProvider(this.getDependencyName(), async () => {
                return {info: {startDepth: 0}, uri: this.getMountPoint()};
            });
        }
    }
}
