/**
 * Calculate the ordered app-item changes needed to transform oldApps into
 * newApps. Membership uses object identity, matching Array.includes() while
 * avoiding repeated linear scans during a dock rebuild.
 *
 * Added positions and removed indices preserve the insertion/removal ordering
 * expected by MaterialDash._redisplay().
 */
export function calculateAppListDiff(oldApps, newApps) {
    const oldAppSet = new Set(oldApps);
    const newAppSet = new Set(newApps);
    const addedItems = [];
    const removedIndices = [];
    const removedApps = new Set();

    let newIndex = 0;
    let oldIndex = 0;
    while (newIndex < newApps.length || oldIndex < oldApps.length) {
        const oldApp = oldApps.length > oldIndex ? oldApps[oldIndex] : null;
        const newApp = newApps.length > newIndex ? newApps[newIndex] : null;

        if (oldApp === newApp) {
            oldIndex++;
            newIndex++;
            continue;
        }

        if (oldApp && !newAppSet.has(oldApp)) {
            removedIndices.push(oldIndex);
            removedApps.add(oldApp);
            oldIndex++;
            continue;
        }

        if (newApp && !oldAppSet.has(newApp)) {
            addedItems.push({app: newApp, pos: newIndex});
            newIndex++;
            continue;
        }

        const nextApp = newApps.length > newIndex + 1 ? newApps[newIndex + 1] : null;
        const insertHere = nextApp && nextApp === oldApp;
        const alreadyRemoved = removedApps.has(newApp);

        if (insertHere || alreadyRemoved) {
            addedItems.push({
                app: newApp,
                pos: newIndex + removedIndices.length,
            });
            newIndex++;
        } else {
            removedIndices.push(oldIndex);
            if (oldApp) removedApps.add(oldApp);
            oldIndex++;
        }
    }

    return {addedItems, removedIndices};
}
