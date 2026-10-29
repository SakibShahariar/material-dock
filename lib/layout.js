/**
 * Calculate an icon size that fits the available dock width.
 *
 * configuredWidth is the dock's measured width at the configured icon size.
 * The result is derived from that baseline on every layout pass, avoiding
 * repeated shrink-on-shrink calculations.
 */
export function calculateAutoFitIconSize(configured, available, configuredWidth) {
    if (configuredWidth <= 0 || configuredWidth <= available) return configured;

    let newSize = Math.floor((configured * available) / configuredWidth);
    // Prefer the 24px floor for normal icons, but allow small icons to shrink
    // to the schema's 16px minimum instead of either growing or refusing to fit.
    const minimum = configured < 24 ? Math.min(16, configured) : 24;
    newSize = Math.max(minimum, Math.min(configured, newSize));
    newSize = Math.floor(newSize / 4) * 4;
    return Math.max(minimum, newSize);
}
