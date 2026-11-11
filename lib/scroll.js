/**
 * Convert a smooth-scroll delta into a single step while preserving any
 * fractional or multi-step remainder for subsequent events.
 */
export function accumulateSmoothScroll(previousDelta, deltaY) {
    const accumulated = (previousDelta ?? 0) - deltaY;
    if (Math.abs(accumulated) < 1) return {direction: 0, remainder: accumulated};

    const direction = Math.sign(accumulated);
    return {direction, remainder: accumulated - direction};
}
