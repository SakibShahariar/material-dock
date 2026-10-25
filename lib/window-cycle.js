/**
 * Return the next window index when cycling an app's interesting windows.
 * The focused window takes precedence over the previous cycle index. A
 * previous index of -1 means cycling has not started yet.
 */
export function getNextWindowIndex(length, focusedIndex, previousIndex, direction) {
    if (!Number.isInteger(length) || length <= 0)
        return -1;
    if (direction !== 1 && direction !== -1)
        return -1;

    const focused = Number.isInteger(focusedIndex) &&
        focusedIndex >= 0 && focusedIndex < length
        ? focusedIndex
        : -1;
    const previous = Number.isInteger(previousIndex)
        ? Math.max(-1, Math.min(previousIndex, length - 1))
        : -1;
    const current = focused >= 0 ? focused : previous;
    const start = current < 0 ? (direction > 0 ? -1 : 0) : current;
    return (start + direction + length) % length;
}
