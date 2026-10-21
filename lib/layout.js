/**
 * Calculate an icon size that fits the available dock width.
 *
 * configuredWidth is the dock's measured width at the configured icon size.
 * The result is derived from that baseline on every layout pass, avoiding
 * repeated shrink-on-shrink calculations.
 */
export function calculateAutoFitIconSize(configured, available, configuredWidth) {
    if (configuredWidth <= 0 || configuredWidth <= available)
        return configured;

    let newSize = Math.floor(configured * available / configuredWidth);
    newSize = Math.max(24, Math.min(configured, newSize));
    newSize = Math.floor(newSize / 4) * 4;
    return Math.max(24, newSize);
}
