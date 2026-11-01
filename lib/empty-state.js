export function hasDockContent({
    appCount = 0,
    showApps = false,
    showDesktop = false,
    minimizedCount = 0,
    stackCount = 0,
} = {}) {
    return [appCount, minimizedCount, stackCount].some(count => Number(count) > 0) ||
        showApps === true ||
        showDesktop === true;
}
