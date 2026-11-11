export class PreviewReopenGuard {
    constructor() {
        this._item = null;
        this._blockedEntry = false;
    }

    suppress(item) {
        if (!item) return;
        this._item = item;
        this._blockedEntry = false;
    }

    isSuppressed(item) {
        return this._item !== null && this._item === item;
    }

    shouldSuppress(item, entered) {
        if (!this._item) return false;

        if (item !== this._item) {
            if (entered) this.clear();
            return false;
        }

        if (entered) {
            this._blockedEntry = true;
            return true;
        }

        if (this._blockedEntry) this.clear();
        return false;
    }

    clearItem(item) {
        if (this._item === item) this.clear();
    }

    clear() {
        this._item = null;
        this._blockedEntry = false;
    }
}
