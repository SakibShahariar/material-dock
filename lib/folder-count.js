export function formatFolderCount(count, partial = false) {
    const safeCount = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
    return partial ? `${safeCount}+` : String(safeCount);
}
