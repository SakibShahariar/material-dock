/**
 * Teardown helpers for extension-owned objects. Kept free of GNOME imports so
 * the lifecycle contract can be unit-tested.
 */

/**
 * Destroy a list of children without letting one failure abort the rest.
 *
 * A half-torn-down dock is dangerous: signals connected to Shell globals stay
 * alive and call back into actors that have already been disposed, which can
 * take down gnome-shell. Every child therefore gets its own try/catch.
 */
export function destroyAll(children, onError = () => {}) {
    for (const child of children) {
        if (!child) continue;
        try {
            child.destroy();
        } catch (error) {
            onError(error);
        }
    }
}
