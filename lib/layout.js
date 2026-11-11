/**
 * Calculate the usable width for a dock on a monitor.
 *
 * GNOME monitor dimensions and St theme padding are both expressed in logical
 * pixels, so do not apply the monitor scale factor a second time. The measured
 * dock width includes its card padding and child controls. Magnification
 * clearance is needed on both sides for a centered dock, but only on the
 * aligned outer edge for a start- or end-aligned dock.
 */
export function calculateAvailableDockWidth(
    monitorWidth,
    margin,
    magnificationReserve = 0,
    alignment = 'center',
) {
    const width = Number.isFinite(monitorWidth) ? Math.max(0, monitorWidth) : 0;
    const edgeMargin = Number.isFinite(margin) ? Math.max(0, margin) : 0;
    const reserve = Number.isFinite(magnificationReserve) ? Math.max(0, magnificationReserve) : 0;
    const reserveEdgeCount = alignment === 'start' || alignment === 'end' ? 1 : 2;
    return Math.max(1, width - 2 * edgeMargin - reserve * reserveEdgeCount);
}

/**
 * Calculate an icon size that fits the available dock width.
 *
 * configuredWidth is the dock's measured width at the configured icon size.
 * The result is derived from that baseline on every layout pass, avoiding
 * repeated shrink-on-shrink calculations.
 */
export function calculateAutoFitIconSize(configured, available, configuredWidth) {
    const iconSize = Number.isFinite(configured) ? Math.max(16, Math.min(128, configured)) : 16;
    if (!Number.isFinite(configuredWidth) || configuredWidth <= 0) return iconSize;

    const availableWidth = Number.isFinite(available) ? Math.max(1, available) : 1;
    if (configuredWidth <= availableWidth) return iconSize;

    let newSize = Math.floor((iconSize * availableWidth) / configuredWidth);
    newSize = Math.max(16, Math.min(iconSize, newSize));
    newSize = Math.floor(newSize / 4) * 4;
    return Math.max(16, newSize);
}

/**
 * Reserve horizontal space for the visual overhang of magnified edge icons.
 * Scaling around the icon center extends each end by half the scale delta.
 */
export function calculateMagnificationReserve(iconSize, scale) {
    const size = Number.isFinite(iconSize) ? Math.max(0, iconSize) : 0;
    const factor = Number.isFinite(scale) ? Math.min(3, Math.max(1, scale)) : 1;
    return (size * (factor - 1)) / 2;
}

/**
 * Keep gaps proportional to icon size so auto-fit layouts do not retain
 * oversized spacing after the icons shrink on narrower monitors.
 */
export function calculateDockItemSpacing(iconSize) {
    const size = Number.isFinite(iconSize) ? Math.max(16, Math.min(128, iconSize)) : 16;
    return Math.max(8, Math.min(16, Math.round(size / 4)));
}

/**
 * Keep minimized-window icons legible when the dock auto-fits to a small
 * monitor. The previous fixed subtraction could produce 2px icons.
 */
export function calculateMinimizedIconSize(iconSize) {
    const size = Number.isFinite(iconSize) ? Math.max(16, Math.min(128, iconSize)) : 16;
    return Math.max(16, size - 14);
}
