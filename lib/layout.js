/**
 * Calculate the usable width for a dock on a monitor.
 *
 * GNOME monitor dimensions and St theme padding are both expressed in logical
 * pixels, so do not apply the monitor scale factor a second time. The measured
 * dock width includes its card padding and child controls; only edge margins
 * need to be deducted from the monitor width.
 */
export function calculateAvailableDockWidth(monitorWidth, margin) {
    const width = Number.isFinite(monitorWidth) ? Math.max(0, monitorWidth) : 0;
    const edgeMargin = Number.isFinite(margin) ? Math.max(0, margin) : 0;
    return Math.max(1, width - 2 * edgeMargin);
}

/**
 * Calculate an icon size that fits the available dock width.
 *
 * configuredWidth is the dock's measured width at the configured icon size.
 * The result is derived from that baseline on every layout pass, avoiding
 * repeated shrink-on-shrink calculations.
 */
export function calculateAutoFitIconSize(
    configured,
    available,
    configuredWidth,
) {
    const iconSize = Number.isFinite(configured)
        ? Math.max(16, Math.min(128, configured))
        : 16;
    if (!Number.isFinite(configuredWidth) || configuredWidth <= 0) {
        return iconSize;
    }

    const availableWidth = Number.isFinite(available)
        ? Math.max(1, available)
        : 1;
    if (configuredWidth <= availableWidth) return iconSize;

    let newSize = Math.floor((iconSize * availableWidth) / configuredWidth);
    newSize = Math.max(16, Math.min(iconSize, newSize));
    newSize = Math.floor(newSize / 4) * 4;
    return Math.max(16, newSize);
}
