export default class DummyFsWatcher {
    on(event, listener) {
        if (event === 'ready') {
            listener();
        }
        return this;
    }
    once(event, listener) {
        if (event === 'ready') {
            listener();
        }
        return this;
    }
    async close() { }
}
